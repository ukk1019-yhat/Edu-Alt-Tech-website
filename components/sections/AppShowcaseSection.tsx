
import React, { useState } from 'react';

const AppShowcaseSection: React.FC = () => {
  const [screen, setScreen] = useState<'dash' | 'tasks' | 'notes'>('dash');

  const [streakCount, setStreakCount] = useState(7);
  const [progressVal, setProgressVal] = useState(62);

  const [notifications, setNotifications] = useState<string[]>([
    'Mentor session starts in 30 minutes',
    'Assignment feedback available'
  ]);

  const [student15Status, setStudent15Status] =
    useState<'Idle' | 'Flagged'>('Idle');

  const incrementStreak = () => {
    setStreakCount(prev => prev + 1);
    setProgressVal(prev => Math.min(prev + 3, 95));
  };

  const sendBroadcast = () => {
    setNotifications(prev => [
      'New class announcement delivered',
      ...prev
    ]);
  };

  const toggleStudent15 = () => {
    setStudent15Status(prev =>
      prev === 'Idle' ? 'Flagged' : 'Idle'
    );
  };

  return (
    <section className="viewport-content">
      <div className="section-header">
        <div className="flabel">Mobile Experience</div>

        <h2 className="mt-12 mb-8">
          Learning and teaching on the move
        </h2>

        <p>
          Purpose-built mobile workspaces for students and educators.
          Focused, distraction-free and optimized for daily use.
        </p>
      </div>

      <div className="phones">
        {/* STUDENT PHONE */}
        <div className="phone">
          <div
            style={{
              width: 48,
              height: 4,
              background: 'var(--ink)',
              margin: '0 auto 12px'
            }}
          />

          <div className="phone-screen">
            {screen === 'dash' && (
              <>
                <div className="flabel mb-8">
                  Study Streak
                </div>

                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    marginBottom: 12
                  }}
                >
                  {streakCount} DAYS
                </div>

                <button
                  className="btn btn-xs btn-full"
                  onClick={incrementStreak}
                >
                  Log Study Session
                </button>

                <div className="asc-sm" />

                <div className="flabel mb-8">
                  Course Progress
                </div>

                <div className="text-xs text-ink-soft mb-8">
                  Full Stack Engineering · {progressVal}%
                </div>

                <div
                  style={{
                    height: 8,
                    border: '2px solid var(--ink)',
                    background: 'var(--bg)'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressVal}%`,
                      background: 'var(--accent)'
                    }}
                  />
                </div>

                <div className="asc-sm" />

                <div className="flabel mb-8">
                  Notifications
                </div>

                <div className="flex flex-col gap-8">
                  {notifications.map((item, index) => (
                    <div
                      key={index}
                      className="p-8"
                      style={{
                        border: '2px solid var(--ink)',
                        background: 'var(--bg-surface)',
                        fontSize: '.65rem'
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}

            {screen === 'tasks' && (
              <>
                <div className="flabel mb-12">
                  Assignments
                </div>

                <div className="flex flex-col gap-12 text-xs">
                  <label className="flex items-center gap-8 cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span
                      style={{
                        textDecoration: 'line-through',
                        opacity: .6
                      }}
                    >
                      Authentication Module
                    </span>
                  </label>

                  <label className="flex items-center gap-8 cursor-pointer">
                    <input type="checkbox" />
                    <span>Database Relationships</span>
                  </label>

                  <label className="flex items-center gap-8 cursor-pointer">
                    <input type="checkbox" />
                    <span>API Integration Lab</span>
                  </label>
                </div>
              </>
            )}

            {screen === 'notes' && (
              <>
                <div className="flabel mb-12">
                  Quick Notes
                </div>

                <textarea
                  className="input"
                  style={{
                    minHeight: 210,
                    resize: 'none'
                  }}
                  placeholder="Capture ideas, reminders or revision notes..."
                />
              </>
            )}
          </div>

          <div className="phone-tabs">
            <button
              className={`phone-tab-btn ${screen === 'dash' ? 'active' : ''}`}
              onClick={() => setScreen('dash')}
            >
              Home
            </button>

            <button
              className={`phone-tab-btn ${screen === 'tasks' ? 'active' : ''}`}
              onClick={() => setScreen('tasks')}
            >
              Tasks
            </button>

            <button
              className={`phone-tab-btn ${screen === 'notes' ? 'active' : ''}`}
              onClick={() => setScreen('notes')}
            >
              Notes
            </button>
          </div>
        </div>

        {/* TEACHER PHONE */}
        <div className="phone">
          <div
            style={{
              width: 48,
              height: 4,
              background: 'var(--ink)',
              margin: '0 auto 12px'
            }}
          />

          <div className="phone-screen">
            <div className="flabel mb-8">
              Live Classroom
            </div>

            <div
              className="p-8 mb-12"
              style={{
                border: '2px solid var(--ink)',
                background: 'var(--bg-surface)'
              }}
            >
              <div className="flex justify-between text-xs">
                <span>Aarav</span>
                <span className="text-accent">ACTIVE</span>
              </div>

              <div
                className="flex justify-between text-xs mt-8"
                style={{
                  borderTop: '2px dashed var(--rule-soft)',
                  paddingTop: 8
                }}
              >
                <span>Maya</span>

                <span
                  className={
                    student15Status === 'Flagged'
                      ? 'text-danger'
                      : 'text-ink-mute'
                  }
                >
                  {student15Status}
                </span>
              </div>
            </div>

            <button
              className="btn btn-xs btn-full"
              onClick={sendBroadcast}
            >
              Broadcast Update
            </button>

            <button
              className="btn btn-xs btn-full mt-8"
              onClick={toggleStudent15}
            >
              {student15Status === 'Flagged'
                ? 'Clear Flag'
                : 'Flag Student'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppShowcaseSection;
