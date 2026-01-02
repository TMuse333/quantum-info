"use client";

import PageRenderer from "./PageRenderer";
import KnowledgeChatbot from "../chatbot/KnowledgeChatbot";

/**
 * Homepage - Wrapper for the index page
 * 
 * Renders the page using PageRenderer which reads from websiteData.json
 * Components will be injected by parent project via GitHub API.
 */
export default function Homepage() {
  return (
    <>
      <PageRenderer pageSlug="index" />
      {/* <KnowledgeChatbot /> */}
    </>
  );
}
