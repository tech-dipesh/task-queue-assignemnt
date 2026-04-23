import redis
import time
import os
from pymongo import MongoClient
from bson import ObjectId

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/aitasks')

print('connecting to redis at', REDIS_HOST, REDIS_PORT)
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

print('connecting to mongodb at', MONGO_URI)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_default_database()
tasks_collection = db['tasks']


def do_operation(input_text, operation):
    if operation == 'uppercase':
        return input_text.upper()

    elif operation == 'lowercase':
        return input_text.lower()

    elif operation == 'reverse':
        return input_text[::-1]

    elif operation == 'wordcount':
        count = len(input_text.split())
        return str(count) + ' words'

    else:
        return None


def process_task(task_id):
    print('processing task id:', task_id)

    task = tasks_collection.find_one({'_id': ObjectId(task_id)})

    if not task:
        print('task not found in db, skipping')
        return

    # set status to running first
    tasks_collection.update_one(
        {'_id': ObjectId(task_id)},
        {'$set': {'status': 'running', 'logs': 'worker picked up the task'}}
    )

    time.sleep(1)  # small delay to simulate processing

    try:
        input_text = task['inputText']
        operation = task['operation']

        result = do_operation(input_text, operation)

        if result is None:
            tasks_collection.update_one(
                {'_id': ObjectId(task_id)},
                {'$set': {
                    'status': 'failed',
                    'logs': 'unsupported operation: ' + operation
                }}
            )
            print('task failed, unknown operation')
            return

        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {'$set': {
                'status': 'success',
                'result': result,
                'logs': 'task completed successfully'
            }}
        )
        print('task completed, result:', result)

    except Exception as e:
        print('error processing task:', e)
        tasks_collection.update_one(
            {'_id': ObjectId(task_id)},
            {'$set': {
                'status': 'failed',
                'logs': 'error: ' + str(e)
            }}
        )


print('worker started, waiting for tasks...')

while True:
    try:
        # brpop blocks and waits until something is in the queue
        # timeout 5 means it will unblock every 5 seconds and loop again
        item = r.brpop('task_queue', timeout=5)

        if item is None:
            continue

        queue_name, task_id = item
        print('got task from queue:', task_id)
        process_task(task_id)

    except redis.exceptions.ConnectionError as e:
        print('redis connection lost, retrying in 3 seconds...', e)
        time.sleep(3)

    except Exception as e:
        print('unexpected error in worker loop:', e)
        time.sleep(2)