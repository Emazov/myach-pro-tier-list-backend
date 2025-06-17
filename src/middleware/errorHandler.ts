import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response<ErrorResponse>,
	next: NextFunction,
) => {
	console.error(err.stack);

	const errorResponse: ErrorResponse = {
		message: err.message || 'Произошла непредвиденная ошибка',
		status: 500,
		error: err.name,
	};

	res.status(500).json(errorResponse);
};
