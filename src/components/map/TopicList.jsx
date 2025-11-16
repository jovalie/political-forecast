import React from 'react'
import { generateGoogleNewsUrl } from '../../utils/googleNewsUtils'
import './TopicList.css'

const TopicList = ({ topics = [], stateName = '' }) => {
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
              aria-label={`View news about ${topic.name} in ${stateName}`}
            >
              <span className="topic-rank">#{index + 1}</span>
              <span className="topic-name">{topic.name}</span>
              <span className="topic-score">{topic.relevanceScore || 0}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default TopicList

