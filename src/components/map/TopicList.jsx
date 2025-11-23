import React from 'react'
import { generateGoogleNewsUrl } from '../../utils/googleNewsUtils'
import { toTitleCase } from '../../utils/tooltipUtils'
import { convertStartedToCurrentTime } from '../../utils/dataUtils'
import { 
  getPoliticalLeaningLabel, 
  getPoliticalLeaningCategory, 
  getPoliticalLeaningColor 
} from '../../utils/politicalLeaningUtils'
import { useTheme } from '../ui/ThemeProvider'
import './TopicList.css'

const TopicList = ({ topics = [], stateName = '', dataTimestamp = null }) => {
  const { isDark } = useTheme()

  if (!topics || topics.length === 0) {
    return (
      <div className="topic-list-empty">
        <p>No topics available for this state.</p>
      </div>
    )
  }

  // Sort topics by relevance score (highest to lowest)
  const sortedTopics = [...topics].sort((a, b) => {
    const scoreA = a.relevanceScore || 0
    const scoreB = b.relevanceScore || 0
    return scoreB - scoreA
  })

  const handleTopicClick = (topicName) => {
    const url = generateGoogleNewsUrl(topicName)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <ol className="topic-list">
      {sortedTopics.map((topic, index) => {
        const googleNewsUrl = generateGoogleNewsUrl(topic.name)
        return (
          <li key={index} className="topic-item">
            <button
              className="topic-link"
              onClick={() => handleTopicClick(topic.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTopicClick(topic.name)
                }
              }}
              aria-label={`View news about ${topic.name} in ${stateName}. ${topic.politicalLeaning !== undefined && topic.politicalLeaning !== null ? `Political leaning: ${getPoliticalLeaningLabel(topic.politicalLeaning)}.` : ''}`}
            >
              <span className="topic-rank">#{index + 1}</span>
              <span className="topic-name">{toTitleCase(topic.name)}</span>
              <span className="topic-stats">
                {topic.searchVolume && (
                  <span className="topic-stat">
                    <span className="topic-stat-label">Search Volume:</span>
                    <span className="topic-stat-value">{topic.searchVolume}</span>
                  </span>
                )}
                {topic.started && (
                  <span className="topic-stat">
                    <span className="topic-stat-label">Started:</span>
                    <span className="topic-stat-value">
                      {convertStartedToCurrentTime(topic.started, dataTimestamp)}
                    </span>
                  </span>
                )}
                {topic.percentageIncrease && (
                  <span className="topic-stat">
                    <span className="topic-stat-label">Percentage Increase:</span>
                    <span className="topic-stat-value">{topic.percentageIncrease}</span>
                  </span>
                )}
                {topic.lastedDuration && (
                  <span className="topic-stat">
                    <span className="topic-stat-label">Lasted Duration:</span>
                    <span className="topic-stat-value">{topic.lastedDuration}</span>
                  </span>
                )}
                {topic.politicalLeaning !== undefined && topic.politicalLeaning !== null && (
                  <span className="topic-stat topic-political-leaning">
                    <span className="topic-stat-label">Political Leaning:</span>
                    <span 
                      className={`topic-stat-value topic-leaning-${getPoliticalLeaningCategory(topic.politicalLeaning)}`}
                      style={{ 
                        color: getPoliticalLeaningColor(topic.politicalLeaning, isDark)
                      }}
                    >
                      {getPoliticalLeaningLabel(topic.politicalLeaning)}
                      <span className="topic-leaning-score">
                        {' '}({topic.politicalLeaning > 0 ? '+' : ''}{topic.politicalLeaning})
                      </span>
                    </span>
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default TopicList

