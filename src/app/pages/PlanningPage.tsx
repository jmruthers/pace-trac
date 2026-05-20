import { Tabs, TabsContent, TabsList, TabsTrigger } from '@solvera/pace-core/components';
import { PagePermissionGuard } from '@solvera/pace-core/rbac';
import { AccommodationList } from '@/features/planning/components/AccommodationList';
import { ActivityList } from '@/features/planning/components/ActivityList';
import { TransportList } from '@/features/planning/components/TransportList';
import { GoogleMapsPlanningProvider } from '@/features/planning/context/GoogleMapsPlanningContext';

export function PlanningPage() {
  return (
    <main>
      <PagePermissionGuard pageName="planning" operation="read">
        <GoogleMapsPlanningProvider>
          <h1>Planning</h1>
          <p>
            Manage transport, accommodation, and activities for the selected event. Location
            addresses are saved as point-in-time snapshots on each row; they do not update
            automatically when external place data changes.
          </p>
          <Tabs defaultValue="transport">
            <TabsList>
              <TabsTrigger value="transport">Transport</TabsTrigger>
              <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="transport">
              <TransportList />
            </TabsContent>
            <TabsContent value="accommodation">
              <AccommodationList />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityList />
            </TabsContent>
          </Tabs>
        </GoogleMapsPlanningProvider>
      </PagePermissionGuard>
    </main>
  );
}
