/** Google Drive integration types. */

export interface DriveConfig {
  serviceAccountKey: string;
  rootFolderId: string;
}

export interface DriveFile {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

export interface UploadResult {
  fileId: string;
  webViewLink: string;
}

export interface Period {
  month: number; // 1-12
  year: number;
}

export interface GoogleAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}
