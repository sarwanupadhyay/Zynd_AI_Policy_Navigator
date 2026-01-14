/**
 * Audit Logger
 * Immutable, timestamped log of all agent actions
 */

class AuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Prevent memory overflow
  }

  /**
   * Log an action
   * @param {String} action - Description of the action
   * @param {String} agentName - Name of the agent performing the action
   * @param {String} status - Status (success, error, warning)
   * @param {Object} metadata - Additional metadata
   */
  log(action, agentName, status = 'success', metadata = {}) {
    const entry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      agent: agentName,
      action: action,
      status: status,
      metadata: metadata
    };

    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with color coding
    this.consoleLog(entry);

    return entry.id;
  }

  /**
   * Console log with formatting
   */
  consoleLog(entry) {
    const statusEmoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const emoji = statusEmoji[entry.status] || '•';
    console.log(`${emoji} [${entry.time}] ${entry.agent}: ${entry.action}`);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logs]; // Return copy to prevent mutation
  }

  /**
   * Get logs by agent
   */
  getLogsByAgent(agentName) {
    return this.logs.filter(log => log.agent === agentName);
  }

  /**
   * Get logs by status
   */
  getLogsByStatus(status) {
    return this.logs.filter(log => log.status === status);
  }

  /**
   * Get logs within time range
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 10) {
    return this.logs.slice(-count);
  }

  /**
   * Search logs by keyword
   */
  searchLogs(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.logs.filter(log =>
      log.action.toLowerCase().includes(lowerKeyword) ||
      log.agent.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get audit statistics
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      byAgent: {},
      byStatus: {},
      timeRange: {
        first: this.logs[0]?.timestamp,
        last: this.logs[this.logs.length - 1]?.timestamp
      }
    };

    this.logs.forEach(log => {
      // Count by agent
      stats.byAgent[log.agent] = (stats.byAgent[log.agent] || 0) + 1;

      // Count by status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export logs as JSON
   */
  exportJSON() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportCSV() {
    if (this.logs.length === 0) return '';

    const headers = ['ID', 'Timestamp', 'Agent', 'Action', 'Status'];
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp,
      log.agent,
      log.action.replace(/,/g, ';'), // Escape commas
      log.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Generate audit trail summary
   */
  generateSummary() {
    const stats = this.getStats();
    
    const summary = {
      overview: {
        totalActions: stats.totalLogs,
        timespan: {
          start: stats.timeRange.first,
          end: stats.timeRange.last
        }
      },
      agentActivity: Object.entries(stats.byAgent).map(([agent, count]) => ({
        agent,
        actionCount: count,
        percentage: ((count / stats.totalLogs) * 100).toFixed(1) + '%'
      })),
      statusBreakdown: stats.byStatus,
      recentActivity: this.getRecentLogs(5)
    };

    return summary;
  }

  /**
   * Verify audit trail integrity
   */
  verifyIntegrity() {
    // Check for tampering (basic check)
    for (let i = 0; i < this.logs.length; i++) {
      const log = this.logs[i];
      
      // Verify required fields
      if (!log.id || !log.timestamp || !log.agent || !log.action) {
        return {
          valid: false,
          error: `Log entry ${i} is missing required fields`
        };
      }

      // Verify chronological order
      if (i > 0) {
        const prevLog = this.logs[i - 1];
        if (new Date(log.timestamp) < new Date(prevLog.timestamp)) {
          return {
            valid: false,
            error: `Log entry ${i} is out of chronological order`
          };
        }
      }
    }

    return {
      valid: true,
      message: 'Audit trail integrity verified'
    };
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all logs (use with caution)
   */
  clear() {
    const count = this.logs.length;
    this.logs = [];
    console.log(`🗑️  Cleared ${count} audit logs`);
  }

  /**
   * Get logs as formatted text
   */
  getFormattedLogs() {
    return this.logs.map(log => {
      const status = log.status.toUpperCase().padEnd(8);
      return `[${log.time}] ${status} ${log.agent}: ${log.action}`;
    }).join('\n');
  }
}

module.exports = AuditLogger;