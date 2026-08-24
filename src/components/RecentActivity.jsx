export default function RecentActivity() {
  const activities = [
    {
      title: "Medical record added for William C. D'choze",
      description: "ICD-10 Code(s): Hypertensive cardiovascular disease (I11), MI (I21.9), Cardiorenal syndrome (I13.0), Chronic kidney disease (N18.9), Aneurysm (I71), Dyslipidemia (E78.5), Allergy, (T78.40), Anemia (D64.9)",
      time: "8 hours ago"
    },
    {
      title: "New Prescription for William C. D'choze",
      description: "Prescription issued",
      time: "8 hours ago"
    },
    {
      title: "New Prescription for Sarah Smith",
      description: "Prescription issued",
      time: "2 days ago"
    },
    {
      title: "Medical record added for Sarah Smith",
      description: "Mild intermittent asthma",
      time: "2 days ago"
    },
    {
      title: "Medical record added for John Doe",
      description: "Essential (primary) hypertension",
      time: "2 days ago"
    }
  ];

  return (
    <div className="section-panel">
      <div className="section-header">
        <h2 className="section-title">Recent Clinical Activity</h2>
      </div>
      
      <div className="timeline">
        {activities.map((activity, index) => (
          <div className="timeline-item" key={index}>
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">
                {activity.title.split('for').map((part, i, arr) => (
                  i === arr.length - 1 ? <span key={i}> for <strong>{part}</strong></span> : <span key={i}>{part}</span>
                ))}
              </div>
              <div className="timeline-desc">
                {activity.time} • {activity.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
