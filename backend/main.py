from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from services.research_agent import ResearchAgent

load_dotenv()

app = FastAPI(title="AI Research Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

research_agent = ResearchAgent()

class ResearchQuery(BaseModel):
    question: str
    max_results: Optional[int] = 10

class ResearchResponse(BaseModel):
    question: str
    sub_questions: List[str]
    summary: str
    sources: List[dict]
    research_id: Optional[str] = None

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    with open("../frontend/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.post("/api/research", response_model=ResearchResponse)
async def conduct_research(query: ResearchQuery):
    try:
        result = await research_agent.conduct_research(
            question=query.question,
            max_results=query.max_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "AI Research Assistant is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8888)