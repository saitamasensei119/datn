import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { roomApi, timeslotApi } from "../../services/api";
import { Building, Clock, Plus, Trash2, Edit, Save, X } from "lucide-react";
import "./Infrastructure.css";

interface Room {
  id: number;
  roomName: string;
  capacity: number;
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Room Form
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomFormData, setRoomFormData] = useState({ roomName: "", capacity: 50 });

  // Timeslot Form
  const [editingTimeslotId, setEditingTimeslotId] = useState<number | null>(null);
  const [timeslotFormData, setTimeslotFormData] = useState({ dayOfWeek: 1, startTime: "07:00", endTime: "09:00" });

  useEffect(() => {
    if (activeTab === "ROOMS") {
      fetchRooms();
    } else {
      fetchTimeslots();
    }
    setError("");
    setSuccess("");
  }, [activeTab]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomApi.getAll();
      setRooms(res.data);
    } catch (err) {
      setError("Không thể tải danh sách phòng học.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeslots = async () => {
    setLoading(true);
    try {
      const res = await timeslotApi.getAll();
      setTimeslots(res.data);
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
      setRoomFormData({ roomName: "", capacity: 50 });
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
    setRoomFormData({ roomName: room.roomName, capacity: room.capacity });
  };

  const cancelEditRoom = () => {
    setEditingRoomId(null);
    setRoomFormData({ roomName: "", capacity: 50 });
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
                    <h3>Danh sách Phòng học</h3>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Tên Phòng</th>
                            <th>Sức Chứa (SV)</th>
                            <th>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rooms.map(room => (
                            <tr key={room.id} className={editingRoomId === room.id ? 'editing-row' : ''}>
                              <td>{room.id}</td>
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
                              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có phòng học nào.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="infra-form glass-card">
                    <h3>{editingRoomId ? 'Sửa Phòng Học' : 'Thêm Phòng Mới'}</h3>
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
                    <h3>Danh sách Ca học</h3>
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
                            .sort((a,b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
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
