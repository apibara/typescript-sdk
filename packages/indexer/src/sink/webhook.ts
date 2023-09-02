/** Webhook sink options */
export type Webhook = {
  sinkType: "webhook";
  sinkOptions: {
    /** Target URL. */
    targetUrl?: string;
    /** Additional headers to send with the request, `key: value` format. */
    header?: string[];
    /** Send the data returned from the transform function as the request body. */
    raw?: boolean;
  };
};
