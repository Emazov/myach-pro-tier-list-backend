export interface ErrorResponse {
	message: string;
	status?: number;
	error?: string;
}

export interface FileResponse {
	key: string;
	url: string;
	contentType?: string;
}

export interface FileListResponse {
	files: FileResponse[];
}
