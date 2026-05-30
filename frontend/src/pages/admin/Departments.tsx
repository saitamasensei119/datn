import React, { useEffect, useState } from 'react';
import { departmentApi } from '../../services/api';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách khoa/ngành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setModalType('create');
    setName('');
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setModalType('edit');
    setName(dept.name);
    setSelectedId(dept.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Tên khoa không được để trống');
      return;
    }

    try {
      if (modalType === 'create') {
        await departmentApi.create({ name });
        setSuccess('Thêm khoa mới thành công!');
      } else if (modalType === 'edit' && selectedId !== null) {
        await departmentApi.update(selectedId, { name });
        setSuccess('Cập nhật thông tin khoa thành công!');
      }
      setIsModalOpen(false);
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoa này? Hành động này có thể ảnh hưởng đến các lớp học phần và giảng viên liên quan.')) {
      return;
    }

    setError('');
    try {
      await departmentApi.delete(id);
      setSuccess('Xóa khoa thành công!');
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể xóa khoa. Khoa có thể đang chứa giảng viên hoặc môn học.');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="glass-card">
      <div className="page-header-flex">
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Quản Lý Khoa / Ngành</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Xem và chỉnh sửa danh sách các khoa đào tạo trong trường
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Thêm khoa mới</span>
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Chưa có khoa/ngành nào được khởi tạo. Bấm nút phía trên để tạo mới.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Tên Khoa / Ngành đào tạo</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.id}</td>
                  <td style={{ fontWeight: '500' }}>{dept.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn-icon-only edit" 
                        onClick={() => openEditModal(dept)}
                        title="Chỉnh sửa khoa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon-only delete" 
                        onClick={() => handleDelete(dept.id)}
                        title="Xóa khoa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'create' ? 'Tạo khoa mới' : 'Cập nhật khoa'}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label" htmlFor="dept-name">
                    Tên khoa / ngành đào tạo
                  </label>
                  <input
                    id="dept-name"
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Khoa Công nghệ thông tin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Thêm mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
