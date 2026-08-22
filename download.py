from datasets import load_dataset
import json
import os

os.makedirs('data', exist_ok=True)
print("Loading dataset...")
ds = load_dataset('ai4bharat/MSMARCO-XI', split='train', streaming=True)

data = []
count = 0
for row in ds:
    data.append({
        'query_id': row['query_id'],
        'query': row['Eng_Query'],
        'passages': row['passages']['English_passages']
    })
    count += 1
    if count >= 100:
        break

print("Saving to dataset.json...")
with open('data/dataset.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done.")
