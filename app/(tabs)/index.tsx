import { WorkshopProvider } from "../../hooks/use-workshop";
import { WorkshopApp } from "../../components/workshop/workshop-app";

export default function HomeScreen() {
  return (
    <WorkshopProvider>
      <WorkshopApp />
    </WorkshopProvider>
  );
}
