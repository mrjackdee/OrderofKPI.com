export interface SupportCenterConfig {
  url: string;
  isLive: boolean;
  statusLabel: string;
  heading: string;
  description: string;
  supportingLine: string;
  buttonLabel: string;
  previewImagePath: string;
  previewImageAlt: string;
  previewCaption: string;
}

export const SUPPORT_CENTER_CONFIG: SupportCenterConfig = {
  url: "https://support.orderofkpi.com/",
  isLive: false,
  statusLabel: "COMING SOON",
  heading: "KP Member Support Center",
  description: "A simpler way to get help is on the way. Soon, members will be able to report technical issues, request digital enhancements, receive a request number, and track progress in one place.",
  supportingLine: "One request. Clear updates. Less follow-up.",
  buttonLabel: "PREVIEW SUPPORT CENTER",
  previewImagePath: "/assets/support_preview.png",
  previewImageAlt: "Preview of the KP Member Support Center website.",
  previewCaption: "Preview of the new KP Member Support Center.",
};
