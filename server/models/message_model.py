from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    tokenId: str
    message: str
    timestamp: Optional[datetime] = None