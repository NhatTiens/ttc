import { Card } from "@/components/ui/card";

export function MaintenanceScreen() {
  return <div className="maintenance-screen"><Card className="maintenance-card"><span className="maintenance-card__mark">TP</span><h1>Hệ thống đang bảo trì</h1><p>Khu vực khách hàng đang tạm dừng để thực hiện bảo trì. Tài khoản và dữ liệu của bạn vẫn được giữ nguyên. Vui lòng quay lại sau.</p></Card></div>;
}
