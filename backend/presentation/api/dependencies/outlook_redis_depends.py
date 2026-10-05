from redis.asyncio import Redis
from fastapi import Request, Depends


def get_redis_object(request: Request) -> Redis:
    redis = getattr(request.app.state, 'redis', None)
    if redis is None:
        raise RuntimeError('Redis is not running.')

    return redis


def get_redis_session(
        session: Redis = Depends(get_redis_object)
) -> Redis:
    return session
