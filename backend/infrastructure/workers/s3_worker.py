from infrastructure.db.database import SessionLocal, engine
from infrastructure.db.uow.meeting_tasks_uow import SqlAlchemyMeetingTasksUoW
from application.services.s3_files_service import S3FileMetadataService
from infrastructure.integrations.s3_client import S3Client
import asyncio
import signal
import logging
from sqlalchemy.exc import TimeoutError as SQLAlchemyTimeoutError


logger = logging.getLogger(__name__)


async def main() -> None:
    service = S3FileMetadataService(SqlAlchemyMeetingTasksUoW(SessionLocal), S3Client())
    loop = asyncio.get_running_loop()
    current_task = asyncio.current_task()

    if not current_task:
        raise RuntimeError('Worker must run inside an asyncio task')

    signals = [signal.SIGTERM]

    for sign in signals:
        loop.add_signal_handler(
            sig=sign,
            callback=current_task.cancel
        )

    try:
        while True:
            try:
                await service.process_cleanup_batch()
                await service.process_uncomleted_uploads()

            except (ConnectionError, TimeoutError, SQLAlchemyTimeoutError) as exc:
                logger.error(
                    'S3_Worker Error during processing cleanup batch or unclompeted tasks',
                    exc_info=(type(exc), exc, exc.__traceback__)
                )

            await asyncio.sleep(5)
    except asyncio.CancelledError:
        logger.info('S3 worker stopped')
    finally:
        await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
