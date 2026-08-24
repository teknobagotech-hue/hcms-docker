import SummaryCards from './SummaryCards';
import UpcomingAppointments from './UpcomingAppointments';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';

export default function Dashboard() {
  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        <SummaryCards />
        
        <div className="dashboard-grid">
          <div className="left-column">
            <UpcomingAppointments />
          </div>
          
          <div className="right-column">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
