from core import AgentState, Task, initialize_vertexai, find_next_available_slot, load_tasks, save_tasks, load_calendar, save_calendar

import os
import uuid
from datetime import datetime, timedelta
from typing import TypedDict, List, Optional, Annotated
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END


# Load tasks and calendar and initialize llm at startup
task_list = load_tasks()
simulated_calendar = load_calendar()
llm = initialize_vertexai()

# Pydantic Models for LLM Structured Output
class ParsedTaskInfo(BaseModel):
    """Information about a task extracted from user input."""
    description: str = Field(..., description="The specific action or item to be done.")
    priority: int = Field(..., ge=1, le=5, description="Priority from 1 (highest) to 5 (lowest).")
    estimated_time_minutes: int = Field(..., description="Estimated time in minutes to complete the task.")

class UserIntent(BaseModel):
    """The user's intent and any extracted task details."""
    intent: str = Field(..., description="Classify the user's primary goal. Options: 'add_task', 'suggest_task', 'list_tasks', 'complete_task', 'greet', 'goodbye', 'unknown'.")
    task_info: Optional[ParsedTaskInfo] = Field(None,description="Details of the task if intent is 'add_task'.")
    task_description_to_complete: Optional[str] = Field(None,description="The description or part of the description of the task to mark as complete, if intent is 'complete_task'.")

# Langraph Agent Node Functions

def parse_user_input(state: AgentState) -> AgentState:
    """
    Uses LLM to understand user input, classify intent, and extract task details.
    Crucially, if priority or estimated time are not provided by the user for 
    'add_task' intent, the LLM is instructed to estimate them.
    """
    print("--- Node: parse_user_input ---")
    
    #Direct Command Check
    # If task_id_to_complete is provided in the input state, bypass LLM
    task_id = state.get('task_id_to_complete')
    if task_id:
        print(f"Direct command received: Complete task ID {task_id}")
        state['intent'] = 'complete_task_by_id'
        state['user_input'] = None # Clear user text input if processing direct command
        state['error'] = None
        return state
    
    if not llm:
        state['error'] = "LLM not configured. Cannot parse input."
        state['intent'] = "unknown"
        state['response'] = state['error']
        return state

    user_input = state['user_input']
    structured_llm = llm.with_structured_output(UserIntent)

    
    prompt = f"""Analyze the user's request regarding their todo list and calendar.

User Request: "{user_input}"

Today's Date: {datetime.now().strftime('%Y-%m-%d')}
Current Time: {datetime.now().strftime('%H:%M')} (Location: Seattle, WA, USA)


Following UserIntent schema, extract from the User Request:
intent: one of 'add_task', 'suggest_task', 'list_tasks', 'complete_task', 'greet', 'goodbye', 'unknown'.

task_info: 
    IF intent is 'add_task' you MUST populate 'task_info' field with a ParsedTaskInfo JSON object:
        description: From the User Request, extract/infer the core task as a to-do list item.
        priority: From the User Request, estimate the task's priority as an integer from 1 to 5, 1 is highest priority, 5 is the lowest priority. 
        estimated_time_minutes: From the User Request, estimate the time in minutes required to complete the task (integer).
        
        EXAMPLES: 
            If user_input is 'Prepare Q2 reports', ParsedTaskInfo is {{description:'Prepare Q2 reports',priority:2,estimated_time_minutes:180}} 
            If user_input is 'Help me remember the laundry needs folding', ParsedTaskInfo is {{description:'Fold laundry',priority:5,estimated_time_minutes:30}} 
            If user_input is 'I need to remember to send the card to Aunt Susie', ParsedTaskInfo is {{description:'Send card to Aunt Susie',priority:2,estimated_time_minutes:5}}
            If user_input is 'I want to send Aunt Susie a card'ParsedTaskInfo is {{description:'Send card to Aunt Susie',priority:3,estimated_time_minutes:30}} 
        (Notice that the last two have the same core description but because the first implied that the card was ready to be sent the time estimated was minimal and priority was increased, whereas the second implied that the card had probably not yet been purchased or written in, so a longer time would be estimated and middling priority inferred.)
        
        ELSE task_info defaults to null

task_description_to_complete:
    IF intent is 'complete_task':
        Extract the description (or keywords) of the task the user wants to complete into the `` field.
    ELSE task_description_to_complete defaults to null

Double-check - IF intent is add_task AND task_info is null THEN refer back to task_info instructions to populate the field correctly. 

Respond ONLY with the structured JSON output matching the UserIntent schema. Do not add explanations.

Example response:{{
                    "intent": "add_task",
                    "task_info": {{
                                "description": "Buy groceries for dinner",
                                "priority": 2,
                                "estimated_time_minutes": 30
                                }},
                    "task_description_to_complete": null
                    }}
"""


    try:
        result = structured_llm.invoke(prompt)
        print(f"LLM Parsing Result: {result}")

        # Update state with parsed info
        state['intent'] = result.intent
        state['extracted_task_info'] = result.task_info.dict() if result.task_info else None
        state['error'] = None # Clear previous error
        
# Handle LLM-based completion intent (user typed "complete...")
        if result.intent == 'complete_task' and result.task_description_to_complete:
            found = False
            task_description_lower = result.task_description_to_complete.lower()
            for i, task in enumerate(task_list):
                if not task.completed and task_description_lower in task.description.lower():
                    # Instead of completing here, set the ID for the dedicated node
                    state['task_id_to_complete'] = task.id
                    state['intent'] = 'complete_task_by_id' # Route to the ID completion node
                    print(f"LLM identified task '{task.description}' (ID: {task.id}) for completion.")
                    found = True
                    break
            if not found:
                state['response'] = f"Sorry, I couldn't find an active task matching '{result.task_description_to_complete}' based on your text."
                print(f"Task completion failed: No match for '{result.task_description_to_complete}'")
                state['intent'] = 'info_provided' # Go to format response directly

        elif result.intent == 'list_tasks':
            # (Logic remains the same)
            active_tasks = [t for t in task_list if not t.completed]
            if not active_tasks: state['response'] = "Your task list is empty!"
            else:
                lines = ["Here are your active tasks:"] + [f"- {t.description} (P{t.priority}, {t.estimated_time_minutes} min)" for t in sorted(active_tasks, key=lambda t: (t.priority, t.added_at))]
                state['response'] = "\n".join(lines)
            state['intent'] = 'info_provided'

    except Exception as e:
        # (Error handling remains similar)
        print(f"Error parsing input with LLM: {e}")
        error_message = f"Sorry, I had trouble understanding or processing that. Please try rephrasing. (Error detail: {e})"
        if "validation error" in str(e).lower(): error_message = f"Sorry, I couldn't extract valid task details... (Error detail: {e})"
        state['intent'] = "unknown"
        state['extracted_task_info'] = None
        state['error'] = error_message
        state['response'] = state['error']
        
    # Add a check here: If intent is add_task, ensure task_info is present AND has the required fields
    if state['intent'] == 'add_task' and (not state['extracted_task_info'] or
                                        'description' not in state['extracted_task_info'] or
                                        'priority' not in state['extracted_task_info'] or
                                        'estimated_time_minutes' not in state['extracted_task_info']):
        print(f"Error: LLM intended 'add_task' but failed to provide complete task_info: {state['extracted_task_info']}")
        state['error'] = "I understood you want to add a task, but I couldn't determine all the necessary details (description, priority, time). Please try adding the task again with more specifics."
        state['response'] = state['error']
        # Override intent to prevent routing to add_task_to_list with incomplete data
        state['intent'] = 'error_handled'


    return state

#Complete task
def complete_task_by_id(state: AgentState) -> AgentState:
    """Marks a task as complete using its ID stored in the state."""
    print("--- Node: complete_task_by_id ---")
    task_id = state.get('task_id_to_complete')
    found = False
    if task_id:
        for i, task in enumerate(task_list):
            if task.id == task_id and not task.completed:
                task_list[i].completed = True
                print(f"Task marked complete by ID: {task_id} ({task.description})")
                # Set a temporary confirmation message; the final response will come after re-suggestion
                state['response'] = f"Marked '{task.description}' as complete."
                found = True
                break
    if not found:
        print(f"Error: Task ID {task_id} not found or already completed.")
        state['error'] = f"Could not mark task as complete (ID: {task_id}). It might not exist or is already done."
        state['response'] = state['error']
        # If completion fails, maybe don't suggest? Go to format response.
        state['intent'] = 'error_handled' # Signal error occurred
    else:
        # Clear the ID and error after successful completion
        state['task_id_to_complete'] = None
        state['error'] = None
        state['intent'] = 'task_completed_suggest_next' # Signal to route to suggest_task

    return state

#Add a task
def add_task_to_list(state: AgentState) -> AgentState:
    """Adds the extracted task details (potentially estimated) to the persistent task list."""
    print("--- Node: add_task_to_list ---")
    if state.get('extracted_task_info'):
        try:
            task_info = state['extracted_task_info']

            #Use extracted/estimated values directly
            description = task_info.get('description')
            priority = task_info.get('priority')
            estimate = task_info.get('estimated_time_minutes')

            # Final check for missing essential data before creating Task object
            if not description or priority is None or estimate is None:
                raise ValueError(f"Incomplete task information received: Desc='{description}', Prio='{priority}', Est='{estimate}'")

            new_task = Task(
                description=description,
                priority=int(priority), # Ensure integer
                estimated_time_minutes=int(estimate), # Ensure integer
            )
            task_list.append(new_task) # Append to the global list
            print(f"Task Added: {new_task}")

            # Include estimated values in confirmation if they were estimated
            # (We don't explicitly know if they were estimated vs user-provided here,
            # but the confirmation is still informative)
            state['response'] = (f"Okay, I've added '{new_task.description}' "
                                    f"(Priority {new_task.priority}, "
                                    f"{new_task.estimated_time_minutes} min) to your list.")
            print(state['response'])

            state['intent'] = 'suggest_task_after_add' # Route to suggestion node next
            state['error'] = None # Clear any previous errors if adding succeeds

        except Exception as e:
            print(f"Error creating or adding task object: {e}")
            state['error'] = f"There was an issue processing the task details: {e}"
            state['response'] = state['error']
            state['intent'] = 'error_handled' # Indicate error occurred
    else:
        # This path should ideally not be reached due to checks in parse_user_input
        print("Error: Add task node reached without extracted_task_info.")
        state['error'] = "Tried to add a task, but no task information was found in the state."
        state['response'] = "Something went wrong - I didn't have the task details to add."
        state['intent'] = 'error_handled'

    return state


# Helper Function: find_next_available_slot
def find_next_available_slot(current_time: datetime = None) -> dict:
    """
    Finds the next free time slot based on the simulated calendar.
    Returns a dictionary with 'free_from', 'free_until', 'free_duration_minutes', 'transition_reason'.
    (Code remains the same as previous version)
    """
    print("--- Helper: find_next_available_slot ---")
    if current_time is None:
        current_time = datetime.now() # Use actual current time for calculations

    sorted_events = sorted(simulated_calendar, key=lambda x: x.start_time)
    busy_until = current_time
    for event in sorted_events:
        if event.start_time <= current_time < event.end_time:
            busy_until = event.end_time
            print(f"Currently busy until {busy_until.strftime('%H:%M')} due to '{event.summary}'")
            break
    next_event_start = None
    next_event_summary = "end of known schedule"
    for event in sorted_events:
        if event.start_time >= busy_until:
            next_event_start = event.start_time
            next_event_summary = event.summary
            print(f"Next event found: '{next_event_summary}' starting at {next_event_start.strftime('%H:%M')}")
            break
    if next_event_start:
        free_duration = next_event_start - busy_until
        free_duration_minutes = int(free_duration.total_seconds() / 60)
        next_transition_time = next_event_start
        transition_reason = f"until '{next_event_summary}' starts"
    else:
        end_of_day = current_time.replace(hour=17, minute=0, second=0, microsecond=0)
        if busy_until < end_of_day:
            free_duration = end_of_day - busy_until
            free_duration_minutes = int(free_duration.total_seconds() / 60)
            next_transition_time = end_of_day
            transition_reason = "until end of workday (assumed 5 PM)"
            print(f"No further events, assuming free until end of day {next_transition_time.strftime('%H:%M')}")
        else:
            free_duration_minutes = 0
            next_transition_time = busy_until
            transition_reason = "as the workday is over or you're busy until then"
            print(f"Busy until {busy_until.strftime('%H:%M')}, which is at or after assumed end of day.")

    print(f"Slot Calculation: Free From={busy_until.strftime('%H:%M')}, Free Until={next_transition_time.strftime('%H:%M')}, Duration={max(0, free_duration_minutes)} min")
    return {
        "free_from": busy_until,
        "free_until": next_transition_time,
        "free_duration_minutes": max(0, free_duration_minutes),
        "transition_reason": transition_reason
    }



#suggest_task
def suggest_task(state: AgentState) -> AgentState:
    """Suggests the best task based on priority, time estimate, and availability."""
    print("--- Node: suggest_task ---")
    current_time = datetime.now() # Use real time now
    slot_info = find_next_available_slot(current_time)
    state['next_event_info'] = slot_info # Store for potential UI display
    available_minutes = slot_info['free_duration_minutes']
    min_task_time_threshold = 5
    if available_minutes < min_task_time_threshold:
        state['suggestion'] = None
        state['response'] = f"You only have about {available_minutes} min free {slot_info['transition_reason']}. Not enough time for most tasks. Maybe take a quick break?"
        state['intent'] = 'info_provided'
        return state
    eligible_tasks = [
        task for task in task_list
        if not task.completed and task.estimated_time_minutes <= available_minutes
    ]
    if not eligible_tasks:
        active_tasks_exist = any(not task.completed for task in task_list)
        if active_tasks_exist:
            state['suggestion'] = None
            state['response'] = f"You have {available_minutes} minutes free {slot_info['transition_reason']}, but none of your active tasks are estimated to fit in this time slot. Consider working on a smaller part of a task, or adding a smaller task."
        else:
            state['suggestion'] = None
            state['response'] = f"You have {available_minutes} minutes free {slot_info['transition_reason']} and your task list is empty! 🎉"
        state['intent'] = 'info_provided'
        return state
    eligible_tasks.sort(key=lambda t: (t.priority, t.estimated_time_minutes))
    best_task = eligible_tasks[0]
    state['suggestion'] = best_task
    state['response'] = (f"Given you have {available_minutes} minutes free {slot_info['transition_reason']}, "
                            f"I suggest working on:\n"
                            f"**Task:** '{best_task.description}'\n"
                            f"**(Priority {best_task.priority}, estimated {best_task.estimated_time_minutes} min)**")
    state['intent'] = 'info_provided'
    print(f"Suggested Task: {best_task.description}")
    return state


#format_response
def format_response(state: AgentState) -> AgentState:
    """Prepares the final response string for the user, handling various intents and errors."""
    print("--- Node: format_response ---")
    if state.get('error'):
        state['response'] = f"Error: {state['error']}"
        print(f"Final Response (Error): {state['response']}")
        return state
    if state.get('response'):
        print(f"Final Response (Pre-set): {state['response']}")
        return state
    intent = state.get('intent', 'unknown')
    if intent == 'greet':
        state['response'] = "Hello! How can I help you manage your tasks today? You can add tasks, ask for suggestions, list tasks, or mark them complete."
    elif intent == 'goodbye':
        state['response'] = "Goodbye! Stay productive!"
    elif intent == 'unknown':
        state['response'] = "Sorry, I'm not sure how to handle that request. You can ask me to 'add task [details]', 'suggest a task', 'list tasks', or 'complete task [description]'."
    else:
        state['response'] = "Okay."
    print(f"Final Response (Formatted): {state['response']}")
    return state
