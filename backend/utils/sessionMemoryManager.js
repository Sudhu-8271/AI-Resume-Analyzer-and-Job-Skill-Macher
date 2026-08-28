/**
 * SESSION MEMORY MANAGER
 * Manages conversation history and context within a session
 * Ensures consistent, context-aware responses
 */

class SessionMemoryManager {
  constructor(maxMemorySize = 50) {
    this.memories = new Map();
    this.maxMemorySize = maxMemorySize;
  }

  /**
   * Create or get session
   */
  createSession(sessionId, resumeData = {}) {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, {
        sessionId,
        createdAt: new Date(),
        resumeData,
        conversationHistory: [],
        context: {},
        metadata: {},
      });
    }
    return this.memories.get(sessionId);
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    return this.memories.get(sessionId);
  }

  /**
   * Add message to history
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata,
    };

    session.conversationHistory.push(message);

    // Maintain max size
    if (session.conversationHistory.length > this.maxMemorySize) {
      session.conversationHistory = session.conversationHistory.slice(-this.maxMemorySize);
    }

    return message;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId, limit = 10) {
    const session = this.getSession(sessionId);
    if (!session) return [];

    return session.conversationHistory.slice(-limit);
  }

  /**
   * Update context
   */
  updateContext(sessionId, contextData) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.context = { ...session.context, ...contextData };
    return session.context;
  }

  /**
   * Get context
   */
  getContext(sessionId) {
    const session = this.getSession(sessionId);
    return session ? session.context : {};
  }

  /**
   * Update resume data
   */
  updateResumeData(sessionId, resumeData) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.resumeData = { ...session.resumeData, ...resumeData };
    return session.resumeData;
  }

  /**
   * Get resume data
   */
  getResumeData(sessionId) {
    const session = this.getSession(sessionId);
    return session ? session.resumeData : {};
  }

  /**
   * Build conversation context for AI
   */
  buildConversationContext(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return "";

    const history = session.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    return history;
  }

  /**
   * Get session summary for debugging
   */
  getSessionSummary(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    return {
      sessionId,
      createdAt: session.createdAt,
      messageCount: session.conversationHistory.length,
      lastMessage: session.conversationHistory[session.conversationHistory.length - 1]?.timestamp,
      resumeDataKeys: Object.keys(session.resumeData),
      contextKeys: Object.keys(session.context),
    };
  }

  /**
   * Clear session
   */
  clearSession(sessionId) {
    this.memories.delete(sessionId);
  }

  /**
   * Clear all expired sessions (older than 24 hours)
   */
  clearExpiredSessions(hoursThreshold = 24) {
    const now = new Date();
    const threshold = hoursThreshold * 60 * 60 * 1000;

    for (const [sessionId, session] of this.memories.entries()) {
      if (now - session.createdAt > threshold) {
        this.memories.delete(sessionId);
      }
    }
  }

  /**
   * Get all active sessions count
   */
  getActiveSessions() {
    return this.memories.size;
  }

  /**
   * Extract key topics from conversation
   */
  extractTopics(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return [];

    const keywords = new Set();
    const topicPatterns = {
      skills: /(?:skill|expertise|experience with|know|familiar with|built with)\s+([a-zA-Z0-9\s,+#.]+)/gi,
      roles: /(?:role|position|title|worked as|was a)\s+([a-zA-Z0-9\s,]+)/gi,
      technologies: /(?:using|technology|framework|library|tool)\s+([a-zA-Z0-9\s,+.]+)/gi,
      concerns: /(?:struggle|challenge|difficulty|help with|need)\s+([a-zA-Z0-9\s,]+)/gi,
    };

    session.conversationHistory.forEach((msg) => {
      if (msg.role === "user") {
        for (const [topic, pattern] of Object.entries(topicPatterns)) {
          let match;
          while ((match = pattern.exec(msg.content)) !== null) {
            keywords.add(match[1].trim());
          }
        }
      }
    });

    return Array.from(keywords);
  }

  /**
   * Generate session insights
   */
  generateSessionInsights(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const totalMessages = session.conversationHistory.length;
    const userMessages = session.conversationHistory.filter(
      (m) => m.role === "user"
    ).length;
    const aiMessages = session.conversationHistory.filter(
      (m) => m.role === "ai"
    ).length;

    const topics = this.extractTopics(sessionId);
    const avgMessageLength =
      session.conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0) /
      totalMessages;

    return {
      totalMessages,
      userMessages,
      aiMessages,
      topics,
      avgMessageLength: Math.round(avgMessageLength),
      duration: new Date() - session.createdAt,
      resumeDataProvided: Object.keys(session.resumeData).length > 0,
    };
  }
}

// Singleton instance for global session management
const globalSessionManager = new SessionMemoryManager();

module.exports = {
  SessionMemoryManager,
  globalSessionManager,
};
