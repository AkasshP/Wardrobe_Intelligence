from fastapi import APIRouter, Depends
from app.schemas.responses import GapAnalysisResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/gaps", tags=["gaps"])


@router.get("", response_model=GapAnalysisResponse)
def get_gap_analysis(user: dict = Depends(get_current_user)):
    return GapAnalysisResponse(
        total_items=0,
        items_by_type={},
        current_combo_count=0,
        suggestions=[],
        color_gaps=[],
    )
