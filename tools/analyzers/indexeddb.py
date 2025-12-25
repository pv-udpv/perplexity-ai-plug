"""IndexedDB analyzer."""

from typing import Dict, Any, List


class IndexedDBAnalyzer:
    """Analyze IndexedDB stores."""
    
    def __init__(self, data: Dict[str, Any]):
        self.data = data.get('indexedDB', [])
    
    def analyze(self) -> Dict[str, Any]:
        """Full IndexedDB analysis."""
        result = {}
        
        for db in self.data:
            db_name = db.get('name', 'unknown')
            result[db_name] = {
                'version': db.get('version'),
                'stores': {}
            }
            
            for store in db.get('stores', []):
                store_name = store.get('name')
                records = store.get('records', [])
                
                result[db_name]['stores'][store_name] = {
                    'record_count': store.get('count', len(records)),
                    'key_path': store.get('keyPath'),
                    'indexes': store.get('indexes', []),
                    'schema': self._infer_schema(records),
                    'cardinality': self._analyze_cardinality(records),
                }
        
        return result
    
    def _infer_schema(self, records: List[Dict]) -> Dict[str, Any]:
        """Infer schema from records."""
        if not records:
            return {}
        
        schema = {}
        first = records[0]
        
        for key, value in first.items():
            if value is None:
                field_type = 'null'
            elif isinstance(value, bool):
                field_type = 'boolean'
            elif isinstance(value, int):
                field_type = 'number'
            elif isinstance(value, str):
                field_type = 'string'
            elif isinstance(value, list):
                field_type = 'array'
            elif isinstance(value, dict):
                field_type = 'object'
            else:
                field_type = type(value).__name__
            
            schema[key] = {
                'type': field_type,
                'presence': f"{sum(1 for r in records if key in r)/len(records)*100:.0f}%",
            }
            
            # For strings, track max length
            if field_type == 'string':
                lengths = [len(str(r.get(key, ''))) for r in records if key in r]
                if lengths:
                    schema[key]['max_length'] = max(lengths)
                    schema[key]['avg_length'] = sum(lengths) / len(lengths)
        
        return schema
    
    def _analyze_cardinality(self, records: List[Dict]) -> Dict[str, Any]:
        """Analyze field cardinality."""
        result = {}
        
        if not records:
            return result
        
        first = records[0]
        for key in first.keys():
            values = [r.get(key) for r in records if key in r]
            unique = len(set(str(v) for v in values))
            result[key] = {
                'unique_values': unique,
                'cardinality_ratio': unique / len(records),
            }
        
        return result
