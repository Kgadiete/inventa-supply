import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Route,
  Navigation,
  Calendar
} from 'lucide-react';

export default function Deliveries() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Planner</h1>
          <p className="text-muted-foreground">
            Route optimization and delivery management (Coming Soon)
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-0 shadow-md bg-gradient-subtle">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Delivery Planner Coming Soon!</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're working on an advanced delivery planning system that will integrate with Google Maps API 
            to provide route optimization, distance calculations, and driver assignments. This feature will 
            help you streamline your delivery operations and reduce transportation costs.
          </p>
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            In Development
          </Badge>
        </CardContent>
      </Card>

      {/* Future Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              Route Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Automatically calculate the most efficient delivery routes to minimize 
              travel time and fuel costs. Integration with Google Maps for real-time 
              traffic data and optimal path planning.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-success" />
              GPS Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Real-time tracking of delivery vehicles and drivers. Monitor progress, 
              estimated arrival times, and receive notifications when deliveries 
              are completed or delayed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-warning" />
              Delivery Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Schedule deliveries based on customer preferences, driver availability, 
              and vehicle capacity. Automatic conflict detection and smart 
              rescheduling capabilities.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-danger" />
              Customer Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage customer delivery addresses, preferences, and special 
              instructions. Maintain delivery history and customer satisfaction 
              ratings for improved service quality.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Fleet Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track vehicle maintenance, fuel consumption, and driver assignments. 
              Monitor vehicle capacity and ensure optimal load distribution 
              across your delivery fleet.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Time Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Support for delivery time windows and customer availability. 
              Smart scheduling that considers traffic patterns, delivery 
              priorities, and time constraints.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Development Timeline */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Development Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-primary-light rounded-lg">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div>
                <p className="font-medium">Phase 1: Basic Delivery Management</p>
                <p className="text-sm text-muted-foreground">Customer addresses, delivery scheduling, and basic route planning</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
              <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
              <div>
                <p className="font-medium">Phase 2: Google Maps Integration</p>
                <p className="text-sm text-muted-foreground">Route optimization, distance calculations, and real-time traffic data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
              <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
              <div>
                <p className="font-medium">Phase 3: Advanced Features</p>
                <p className="text-sm text-muted-foreground">GPS tracking, fleet management, and delivery analytics</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-4">
            While we're developing the delivery planner, make sure your inventory and supplier 
            data is well-organized to take full advantage of the delivery features when they launch.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled>
              <Truck className="w-4 h-4 mr-2" />
              Plan Deliveries (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              <MapPin className="w-4 h-4 mr-2" />
              Manage Routes (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}