import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { roomApi, timeslotApi } from "../../services/api";
import { Building, Clock, Trash2, Edit, Save, X, RefreshCw, Upload } from "lucide-react";
import "./Infrastructure.css";

interface Room {
  id: number;
  roomName: string;
  capacity: number;
  building?: string;
}

interface Timeslot {
  id: number;
  dayOfWeek: number;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
}

const Infrastructure: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ROOMS" | "TIMESLOTS">("ROOMS");
  
  // Data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  
  // States
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Room Form
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomFormData, setRoomFormData] = useState({ roomName: "", capacity: 50, building: "" });

  // Timeslot Form
  const [editingTimeslotId, setEditingTimeslotId] = useState<number | null>(null);
  const [timeslotFormData, setTimeslotFormData] = useState({ dayOfWeek: 1, startTime: "07:00", endTime: "09:00" });

  // Pagination States
  const [roomPage, setRoomPage] = useState(0);
  const [roomSize, setRoomSize] = useState(10);
  const [roomTotalPages, setRoomTotalPages] = useState(0);

  const [timeslotPage, setTimeslotPage] = useState(0);
  const [timeslotSize, setTimeslotSize] = useState(10);
  const [timeslotTotalPages, setTimeslotTotalPages] = useState(0);

  useEffect(() => {
    if (activeTab === "ROOMS") {
      fetchRooms();
    } else {
      fetchTimeslots();
    }
    setError("");
    setSuccess("");
  }, [activeTab, roomPage, roomSize, timeslotPage, timeslotSize]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomApi.getPage(roomPage, roomSize);
      setRooms(res.data.content);
      setRoomTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Không thể tải danh sách phòng học.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeslots = async () => {
    setLoading(true);
    try {
      const res = await timeslotApi.getPage(timeslotPage, timeslotSize);
      setTimeslots(res.data.content);
      setTimeslotTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Không thể tải danh sách ca học.");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: return "Thứ 2";
      case 2: return "Thứ 3";
      case 3: return "Thứ 4";
      case 4: return "Thứ 5";
      case 5: return "Thứ 6";
      case 6: return "Thứ 7";
      case 7: return "Chủ Nhật";
      default: return "";
    }
  };

  // --- ROOM ACTIONS ---
  const handleSaveRoom = async () => {
    try {
      setError("");
      if (!roomFormData.roomName.trim()) {
        setError("Tên phòng không được để trống.");
        return;
      }
      
      if (editingRoomId) {
        await roomApi.update(editingRoomId, roomFormData);
        setSuccess("Cập nhật phòng học thành công!");
      } else {
        await roomApi.create(roomFormData);
        setSuccess("Thêm phòng học thành công!");
      }
      setEditingRoomId(null);
      setRoomFormData({ roomName: "", capacity: 50, building: "" });
      fetchRooms();
    } catch (err: any) {
      setError(err.response?.data || "Đã xảy ra lỗi khi lưu phòng học.");
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng học này?")) return;
    try {
      await roomApi.delete(id);
      setSuccess("Xóa phòng học thành công!");
      fetchRooms();
    } catch (err: any) {
      setError("Không thể xóa phòng học do đang được sử dụng.");
    }
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomFormData({ roomName: room.roomName, capacity: room.capacity, building: room.building || "" });
  };

  const cancelEditRoom = () => {
    setEditingRoomId(null);
    setRoomFormData({ roomName: "", capacity: 50, building: "" });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setError("");
    setSuccess("");
    try {
      const res = await roomApi.importExcel(file);
      const data = res.data;
      setSuccess(`Import thành công! Đã tạo mới ${data.created} phòng, bỏ qua ${data.skipped} phòng trùng/lỗi ${data.errors} dòng.`);
      fetchRooms();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi import file Excel.");
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAutoGenerateRooms = async () => {
    const rawData = "D9-503 D9-503 D9-504 D8-302 D3-105 D8-1004 C7-228 C7-217 C7-203 C7-230 C7-213 C7-107 D6-303 C7-236 D9-503 D9-503 D9-504 D8-302 D3-105 D8-1004 C7-228 C7-217 C7-203 C7-230 C7-213 C7-107 D6-303 C7-236 C4-401A D7-301 D3-106 D6-304 C7-119 C4-301 TTB4 D6-302 D3-405 D3-406 D8-402 C10-107 C10-108 C4-401B D9-302 D4-206 D9-103 D8-301 D9-102 D9-106 D5-405 D5-402 C7-105 C7-234 D9-205 D5-503 D5-504 C4-204 C4-111 C7-212 D5-403 D4-304 D6-305 NULL D9-406 D9-206 D8-104 D9-304 D8-406 C10-101 C7-130 C4-112 D7-306 C4-206A D6-101 B1-306 C7-207 B1-307 D4-402 D9-204 B1-305 B1-309 D6-401 D7-203 D4-303 D6-403 C4-209 C7-233 D9-508 D7-406 C7-204 C7-209 D7-308 D5-102 D5-302 C7-205 D5-202 D5-203 C1-405 C1-416 C1-406 C1-403 D5-204 D5-304 D5-104 D5-303 D5-404 D6-206 D7-101 D9-203 D9-104 D7-105 D6-103 D6-104 D6-102 C1-423 D4-204 D9-306 C7-223 D8-408 D6-107 D8-101 D8-405 D9-305 D8-102 D4-205 D4-104 C1-419A C1-419B D9-303 D7-204 C1-409 C1-410 C1-411 D8-306 C1-413 C1-418 D6-306 D5-201 D5-101 D9-101 D4-305 C3-4-312 C4-105 C4-107 C5-10-301 C7-133 C4-305 C4-304 D7-205 C4-303 C7-108 C7-235 D8-103 C4-104 C7-237 C7-211 C7-249 C7-238 C5-308 C7-214 C7-225 D7-401 C4-101 C4-102 D8-502 D7-407 C4-5-301 C7-117 D3-404 C7-128 D9-505 D9-105 D9-202 C7-113 C7-219 C7-E412 C7-111 C7-E301 TC-408 TC-308 D7-403 D7-404 D4-404 D7-106 D7-201 D7-202 C7-E303 D8-803 D7-302 D6-301 D8-504 D8-501 D8-805 C7-215 C7-E407 D8-809 C7-103 D8-807 D5-401 D7-402 C7-E514 D7-405 D8-907 D8-808 D9-407 D9-502 D8-905 D5-505 C7-115 D8-904 D8-906 C7-123 C7-E320 D4-503 D4-502 D6-402 D7-307 C7-E322 C7-E316 D8-304 D8-403 D8-902 D8-901 D8-909 D6-105 C7-114 D8-311 D8-503 C1-116 C1-120 C7-E513 D8-1106 C7-E309 D5-501 D8-802 D9-405 C7-239 D8-1102 D3-104 D8-903 C7-101 D4-403 D8-401 D8-309 D8-307 D3-501 D3-101 D9-201 D3-401 D3-402 D9-401 D3-201 D3-301 D3-5-201 GĐ-B1 D8-303 D8-407 TVTQB-922 D8-205 D4-306 D5-502 TC-412 D9-402 D4-203 D3-403 D8-707 C7-E410 D9-404 TC-407 D8-1008 T-312 D8-705 D8-706 D8-703 D8-704 D8-702 D8-708 D8-505 D8-709 D4-406 D8-1005A D8-1005B D8-1007A D8-1007B D8-1006 D8-1002 D8-1003 D8-1009 C7-E406 D4-505 D4-504 TC-307 D8-1001 C7-E324 C7-E318 C7-E326 C9-110 C7-E408 C4B-101 C10-305 C10-405 C10-304 C3-307B C5-10-101 C4-5-102 D6-106 D6-205 D4-401 D4-301 D4-202 D4-101 D4-102 D4-103 D4-302 D4-201 D8-305 C7-126 C7-125 C7-216 C7-121 VDZ C7-M408 C7-M412 15B-TQBuu 15B-TQBuu-110C C7-M404 15B-TQBuu-109 C7-M402 C7-M406 TVTQB-705 C7-M416 T-114 D9-408 B1-106 D6-208 B1-107 B1-108 B1-202 B1-109 B1-207 B1-208 B1-204 B1-405 B1-402 TC-312 D9-501 D9-403 B1-504 B1-206 D9-301 B1-209 B1-203 B1-201 D8-201 D8-203 D8-207 T-508 T-113 NhaT-KT-202 NhaT-KT-203 T-406 D4-405 T-105 T-107 T-112 T-101B T-102 T-215 T-401 T-207 C7-247 T-405 NhaT-KT-205 NhaT-KT-204 T-104 203-NO3-15-TQB NhaT-KT-201 T-103 T-505 C7-M311 T-104B NhaT-KT-101 T-208 T-210 NhaT-KT-102 C7-M305 T-510 T-110 T-501 T-511 T-509 T-512 T-506 D5-103 D3-5-301 D3-5-401 D3-5-501 SanB7 San KTX SanB13 C10B-403 C5-201A C10B-404 B1-707 D7-505 T-303 D2B T-301 No5-40TQB T-310 D7-503 D7-502 C5-209 D8-701 C5-210 T-311 T-309 C14B Nha B-102 C5-301A C10B-106 C5-304 Nha A-201 Nha A-101 SVD Sân bóng 2 Sân bóng 1 SVĐ 1 SVĐ 2 Bể bơi Sân bóng 3 NTD D3-306 D3-202 D3-203 D3-206 D3-506 D3-205 D3-305 D3-303 D3-304 D3-204 C9-108 C10-412 C10-408 C9-105 C9-211 C9-107 D6-404 D6-405 D6-406 D7-102 D5-301 C15-101 T-214 T-108 NhaT-khungthep-107 T-408 T-407 NhaT-khungthep-207 T-409 T-109 T-407A T-211 C7-M414 T-203A T-203B T-201 C3-210 C5-116 C3-209 T-204 T-202 D7-506";
    // Tách chuỗi theo khoảng trắng/xuống dòng, tự động loại bỏ trùng lặp bằng Set
    const sampleRooms = Array.from(new Set(rawData.split(/\s+/).filter(room => room.trim() !== "")));
    
    if (!window.confirm(`Hành động này sẽ tạo ${sampleRooms.length} phòng học mẫu với sức chứa mặc định 200. Các phòng trùng tên có thể báo lỗi. Tiếp tục?`)) return;
    
    setLoading(true);
    try {
      let added = 0;
      for (const roomName of sampleRooms) {
        try {
          await roomApi.create({ roomName, capacity: 200 });
          added++;
        } catch (e) {
          console.error("Lỗi khi thêm phòng (có thể đã tồn tại):", roomName);
        }
      }
      setSuccess(`Khởi tạo thành công ${added}/${sampleRooms.length} phòng học mẫu!`);
      fetchRooms();
    } catch (err: any) {
      setError("Đã xảy ra lỗi chung khi tạo phòng học mẫu.");
    } finally {
      setLoading(false);
    }
  };

  // --- TIMESLOT ACTIONS ---
  const handleSaveTimeslot = async () => {
    try {
      setError("");
      
      // Basic time validation
      if (timeslotFormData.startTime >= timeslotFormData.endTime) {
        setError("Giờ kết thúc phải sau giờ bắt đầu.");
        return;
      }

      // Add seconds if missing
      const formatTime = (time: string) => time.length === 5 ? `${time}:00` : time;
      
      const payload = {
        dayOfWeek: timeslotFormData.dayOfWeek,
        startTime: formatTime(timeslotFormData.startTime),
        endTime: formatTime(timeslotFormData.endTime)
      };

      if (editingTimeslotId) {
        await timeslotApi.update(editingTimeslotId, payload);
        setSuccess("Cập nhật ca học thành công!");
      } else {
        await timeslotApi.create(payload);
        setSuccess("Thêm ca học thành công!");
      }
      setEditingTimeslotId(null);
      setTimeslotFormData({ dayOfWeek: 1, startTime: "07:00", endTime: "09:00" });
      fetchTimeslots();
    } catch (err: any) {
      setError(err.response?.data || "Đã xảy ra lỗi khi lưu ca học.");
    }
  };

  const handleDeleteTimeslot = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ca học này?")) return;
    try {
      await timeslotApi.delete(id);
      setSuccess("Xóa ca học thành công!");
      fetchTimeslots();
    } catch (err: any) {
      setError("Không thể xóa ca học do đang được sử dụng.");
    }
  };

  const startEditTimeslot = (ts: Timeslot) => {
    setEditingTimeslotId(ts.id);
    setTimeslotFormData({ 
      dayOfWeek: ts.dayOfWeek, 
      startTime: ts.startTime.substring(0, 5), 
      endTime: ts.endTime.substring(0, 5) 
    });
  };

  const cancelEditTimeslot = () => {
    setEditingTimeslotId(null);
    setTimeslotFormData({ dayOfWeek: 1, startTime: "07:00", endTime: "09:00" });
  };

  const handleAutoGenerateTimeslots = async () => {
    if (!window.confirm("Hành động này sẽ tạo tự động bộ Ca học từ Thứ 2 đến Chủ Nhật. Các ca đã tồn tại sẽ được bỏ qua. Tiếp tục?")) return;
    try {
      setLoading(true);
      await timeslotApi.autoGenerate();
      setSuccess("Khởi tạo bộ ca học mẫu thành công!");
      fetchTimeslots();
    } catch (err: any) {
      setError("Đã xảy ra lỗi khi tạo tự động ca học.");
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-container infra-page">
        <div className="page-header">
          <h2>Quản Lý Hạ Tầng</h2>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'ROOMS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ROOMS')}
          >
            <Building size={18} /> Phòng Học
          </button>
          <button 
            className={`tab-btn ${activeTab === 'TIMESLOTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TIMESLOTS')}
          >
            <Clock size={18} /> Ca Học
          </button>
        </div>

        <div className="tab-content">
          {loading && rooms.length === 0 && timeslots.length === 0 ? (
            <div className="spinner"></div>
          ) : (
            <>
              {activeTab === 'ROOMS' && (
                <div className="infra-grid">
                  <div className="infra-list glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                      <h3 style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>Danh sách Phòng học</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <label className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', cursor: isImporting ? 'not-allowed' : 'pointer', margin: 0 }}>
                          <Upload size={14} style={{ marginRight: '4px' }} />
                          <span>{isImporting ? 'Đang Nhập...' : 'Nhập Excel'}</span>
                          <input
                            type="file"
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                            onChange={handleImportExcel}
                            disabled={loading || isImporting}
                          />
                        </label>
                        <button className="btn btn-sm btn-secondary" onClick={handleAutoGenerateRooms} disabled={loading || isImporting}>
                          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Tạo Mẫu
                        </button>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Tòa Nhà</th>
                            <th>Tên Phòng</th>
                            <th>Sức Chứa (SV)</th>
                            <th>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rooms.map(room => (
                            <tr key={room.id} className={editingRoomId === room.id ? 'editing-row' : ''}>
                              <td>{room.id}</td>
                              <td><span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{room.building || "-"}</span></td>
                              <td>{room.roomName}</td>
                              <td>{room.capacity}</td>
                              <td>
                                <button className="btn-icon text-primary" onClick={() => startEditRoom(room)} title="Sửa">
                                  <Edit size={16} />
                                </button>
                                <button className="btn-icon text-danger" onClick={() => handleDeleteRoom(room.id)} title="Xóa">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {rooms.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có phòng học nào.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination for Rooms */}
                    <div className="pagination-controls mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hiển thị:</span>
                        <select className="form-control form-control-sm w-auto" value={roomSize} onChange={(e) => { setRoomSize(Number(e.target.value)); setRoomPage(0); }}>
                          <option value={10}>10 dòng</option>
                          <option value={15}>15 dòng</option>
                          <option value={20}>20 dòng</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn btn-sm btn-secondary" disabled={roomPage === 0} onClick={() => setRoomPage(p => p - 1)}>Trước</button>
                        <span style={{ fontSize: '0.9rem' }}>Trang {roomPage + 1} / {Math.max(1, roomTotalPages)}</span>
                        <button className="btn btn-sm btn-secondary" disabled={roomPage >= roomTotalPages - 1 || roomTotalPages === 0} onClick={() => setRoomPage(p => p + 1)}>Sau</button>
                      </div>
                    </div>
                  </div>
                  <div className="infra-form glass-card">
                    <h3>{editingRoomId ? 'Sửa Phòng Học' : 'Thêm Phòng Mới'}</h3>
                    <div className="form-group">
                      <label>Tòa Nhà</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="VD: TC, D9, B1..."
                        value={roomFormData.building}
                        onChange={e => setRoomFormData({...roomFormData, building: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tên Phòng</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="VD: Phòng 101"
                        value={roomFormData.roomName}
                        onChange={e => setRoomFormData({...roomFormData, roomName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sức Chứa (Sinh viên)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min={1}
                        value={roomFormData.capacity}
                        onChange={e => setRoomFormData({...roomFormData, capacity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={handleSaveRoom}>
                        <Save size={16} /> Lưu
                      </button>
                      {editingRoomId && (
                        <button className="btn btn-secondary" onClick={cancelEditRoom}>
                          <X size={16} /> Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'TIMESLOTS' && (
                <div className="infra-grid">
                  <div className="infra-list glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                      <h3 style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>Danh sách Ca học</h3>
                      <button className="btn btn-sm btn-secondary" onClick={handleAutoGenerateTimeslots}>
                        <RefreshCw size={14} style={{ marginRight: '4px' }} /> Tạo Mẫu
                      </button>
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Ngày học</th>
                            <th>Giờ bắt đầu</th>
                            <th>Giờ kết thúc</th>
                            <th>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeslots
                            .map(ts => (
                            <tr key={ts.id} className={editingTimeslotId === ts.id ? 'editing-row' : ''}>
                              <td><strong>{getDayName(ts.dayOfWeek)}</strong></td>
                              <td>{ts.startTime.substring(0, 5)}</td>
                              <td>{ts.endTime.substring(0, 5)}</td>
                              <td>
                                <button className="btn-icon text-primary" onClick={() => startEditTimeslot(ts)} title="Sửa">
                                  <Edit size={16} />
                                </button>
                                <button className="btn-icon text-danger" onClick={() => handleDeleteTimeslot(ts.id)} title="Xóa">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {timeslots.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có ca học nào.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination for Timeslots */}
                    <div className="pagination-controls mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hiển thị:</span>
                        <select className="form-control form-control-sm w-auto" value={timeslotSize} onChange={(e) => { setTimeslotSize(Number(e.target.value)); setTimeslotPage(0); }}>
                          <option value={10}>10 dòng</option>
                          <option value={15}>15 dòng</option>
                          <option value={20}>20 dòng</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn btn-sm btn-secondary" disabled={timeslotPage === 0} onClick={() => setTimeslotPage(p => p - 1)}>Trước</button>
                        <span style={{ fontSize: '0.9rem' }}>Trang {timeslotPage + 1} / {Math.max(1, timeslotTotalPages)}</span>
                        <button className="btn btn-sm btn-secondary" disabled={timeslotPage >= timeslotTotalPages - 1 || timeslotTotalPages === 0} onClick={() => setTimeslotPage(p => p + 1)}>Sau</button>
                      </div>
                    </div>
                  </div>
                  <div className="infra-form glass-card">
                    <h3>{editingTimeslotId ? 'Sửa Ca Học' : 'Thêm Ca Mới'}</h3>
                    <div className="form-group">
                      <label>Ngày học</label>
                      <select 
                        className="form-control"
                        value={timeslotFormData.dayOfWeek}
                        onChange={e => setTimeslotFormData({...timeslotFormData, dayOfWeek: Number(e.target.value)})}
                      >
                        <option value={1}>Thứ 2</option>
                        <option value={2}>Thứ 3</option>
                        <option value={3}>Thứ 4</option>
                        <option value={4}>Thứ 5</option>
                        <option value={5}>Thứ 6</option>
                        <option value={6}>Thứ 7</option>
                        <option value={7}>Chủ Nhật</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Từ giờ</label>
                        <input 
                          type="time" 
                          className="form-control" 
                          value={timeslotFormData.startTime}
                          onChange={e => setTimeslotFormData({...timeslotFormData, startTime: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Đến giờ</label>
                        <input 
                          type="time" 
                          className="form-control" 
                          value={timeslotFormData.endTime}
                          onChange={e => setTimeslotFormData({...timeslotFormData, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={handleSaveTimeslot}>
                        <Save size={16} /> Lưu
                      </button>
                      {editingTimeslotId && (
                        <button className="btn btn-secondary" onClick={cancelEditTimeslot}>
                          <X size={16} /> Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Infrastructure;
