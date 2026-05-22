export interface DevEmailPreview {
  to: string;
  subject: string;
  body: string;
  actionUrl: string;
}

export interface MessageResponse {
  message: string;
  devEmailPreview?: DevEmailPreview;
}
