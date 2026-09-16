import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
export default function Providers(){return <div className="admin-page"><PageHeader eyebrow="ADMIN / PROVIDERS" title="Nhà cung cấp" description="Khu vực chuẩn bị cho Work Provider Integration."/><Card className="admin-placeholder-card"><span>CONFIGURATION READY</span><h2>Chưa kết nối provider</h2><p>Work 05 không gọi API nhà cung cấp, không gọi Tương Tác Chéo và không giả lập trạng thái provider. Navigation này chỉ giữ vị trí kiến trúc cho work tiếp theo.</p></Card></div>}
