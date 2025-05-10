from pydantic import BaseModel, Field
from typing import TypedDict, List, Optional
from datetime import datetime
import uuid
import json
import os
from pathlib import Path
import google.oauth2.service_account
import vertexai
from vertexai.generative_models import GenerativeModel

# File paths for persistent storage
tasks_file = Path("app/database/tasks.json")
calendar_file = Path("app/database/calendar.json")

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

# Initialize the database files if they don't exist
if not tasks_file.exists():
    tasks_file.parent.mkdir(parents=True, exist_ok=True)
    with open(tasks_file, "w") as f:
        json.dump([], f)
if not calendar_file.exists():
    calendar_file.parent.mkdir(parents=True, exist_ok=True)
    with open(calendar_file, "w") as f:
        json.dump([], f)

def load_tasks():
    if tasks_file.exists():
        with open(tasks_file, "r") as f:
            return [Task(**task) for task in json.load(f)]
    return []

def save_tasks(tasks):
    with open(tasks_file, "w") as f:
        json.dump([task.dict() for task in tasks], f, indent=4)

def load_calendar():
    if calendar_file.exists():
        with open(calendar_file, "r") as f:
            return [CalendarEvent(**event) for event in json.load(f)]
    return []

def save_calendar(events):
    with open(calendar_file, "w") as f:
        json.dump([event.dict() for event in events], f, indent=4)

def initialize_vertexai(model_name: str = "gemini-1.5-pro"):
    GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
    GCP_SA_KEY_PATH = ".env/GCP_SA_KEY.json"

    #LLM initialization
    try:
        # Create credentials object directly from the dictionary info
        credentials = google.oauth2.service_account.Credentials.from_service_account_file(GCP_SA_KEY_PATH)
        print("Credentials retrieved.")

        # Initialize Vertex AI using the credentials object 
        vertexai.init(project=GCP_PROJECT_ID, location='us-central1', credentials=credentials) # ADDED credentials=...
        print("Vertex AI Initialized Successfully.")
        
        # Specify a model - we're using gemini 1.5 pro for initial development
        llm = GenerativeModel(model_name=model_name, temperature=0.2, max_output_tokens=512) 
        print(f"{model_name} Model Loaded.")

        return llm

    except Exception as e:
        print(f"Error during initialization: {e}")
        print("Please ensure 'GCP_PROJECT_ID' and 'GCP_SA_KEY_JSON' secrets are correctly set and the Service Account has 'Vertex AI User' role.")
        # Check if the error is related to parsing the JSON itself
        if isinstance(e, json.JSONDecodeError):
            print("Error: Could not parse the GCP_SA_KEY_JSON content. Ensure it's valid JSON.")
        # Check if error is related to creating credentials from info
        elif "Could not parse service account file" in str(e):
            print("Error: The structure of the JSON key seems incorrect for creating credentials.")

