from bson import ObjectId
from datetime import datetime
from typing import Any, Dict, List, Union

def to_object_id(id_val: Union[str, ObjectId, None]) -> Union[ObjectId, None]:
    if id_val is None:
        return None
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str) and ObjectId.is_valid(id_val):
        return ObjectId(id_val)
    return id_val

def serialize_doc(doc: Any) -> Any:
    """Recursively converts MongoDB BSON documents (ObjectIds, datetimes) to JSON-serializable dicts matching Mongoose output format."""
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                str_id = str(value) if isinstance(value, ObjectId) else value
                result["_id"] = str_id
                # Mongoose often populates or exposes id as well
                result["id"] = str_id
            else:
                result[key] = serialize_doc(value)
        return result
    return doc

def clean_doc_for_db(data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepares dict for MongoDB insert/update, converting id/_id fields if valid ObjectIds and removing virtual id"""
    if not isinstance(data, dict):
        return data
    cleaned = dict(data)
    if "id" in cleaned and "_id" not in cleaned:
        if ObjectId.is_valid(cleaned["id"]):
            cleaned["_id"] = ObjectId(cleaned.pop("id"))
    elif "id" in cleaned and "_id" in cleaned:
        del cleaned["id"]
    return cleaned
