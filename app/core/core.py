from pydantic import BaseModel, Field
from typing import TypedDict, List, Optional
from datetime import datetime
import uuid

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    priority: int = Field(description="Priority from 1 (highest) to 5 (lowest)", ge=1, le=5)
    estimated_time_minutes: int = Field(description="Estimated time in minutes")
    added_at: datetime = Field(default_factory=datetime.now)
    completed: bool = False

class CalendarEvent(BaseModel):
    start_time: datetime
    end_time: datetime
    summary: str

class AgentState(TypedDict):
    user_input: Optional[str]
    task_id_to_complete: Optional[str]
    intent: str
    extracted_task_info: Optional[dict]
    suggestion: Optional[Task]
    next_event_info: Optional[dict]
    response: str
    error: Optional[str]

# Helper function for calendar
def find_next_available_slot(current_time: datetime = None) -> dict:
    # ...existing code for finding the next available slot...
    pass
