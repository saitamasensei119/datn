package com.datct.datn.modules.seed.service;

import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.enrollment.entity.PreRegistration;
import com.datct.datn.modules.enrollment.repository.PreRegistrationRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import com.datct.datn.modules.user.entity.Department;
import com.datct.datn.modules.user.entity.Role;
import com.datct.datn.modules.user.entity.User;
import com.datct.datn.modules.user.repository.DepartmentRepository;
import com.datct.datn.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class DataSeederService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private PreRegistrationRepository preRegistrationRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public String seedPreRegistrations(Long semesterId, int numStudents, int maxSubjects) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ"));

        List<Subject> allSubjects = subjectRepository.findAll();
        if (allSubjects.isEmpty()) {
            throw new RuntimeException("Không có môn học nào trong DB để seed.");
        }

        Department department = departmentRepository.findAll().stream().findFirst().orElse(null);

        String defaultPasswordHash = passwordEncoder.encode("123456");

        List<User> usersToSave = new ArrayList<>();
        List<Student> studentsToSave = new ArrayList<>();
        List<PreRegistration> preRegistrationsToSave = new ArrayList<>();

        for (int i = 0; i < numStudents; i++) {
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            
            User user = new User();
            user.setFullName("Dummy Student " + uniqueId);
            user.setEmail("dummy_" + uniqueId + "@school.edu.vn");
            user.setPassword(defaultPasswordHash);
            user.setRole(Role.STUDENT);
            usersToSave.add(user);

            Student student = new Student();
            student.setUser(user);
            student.setStudentCode("DUMMY_" + uniqueId);
            student.setDepartment(department);
            studentsToSave.add(student);

            // Randomize subjects
            List<Subject> shuffledSubjects = new ArrayList<>(allSubjects);
            Collections.shuffle(shuffledSubjects);
            int subjectsCount = (int) (Math.random() * maxSubjects) + 1;
            if (subjectsCount > shuffledSubjects.size()) {
                subjectsCount = shuffledSubjects.size();
            }

            for (int j = 0; j < subjectsCount; j++) {
                PreRegistration pr = new PreRegistration();
                pr.setStudent(student);
                pr.setSemester(semester);
                pr.setSubject(shuffledSubjects.get(j));
                preRegistrationsToSave.add(pr);
            }
        }

        userRepository.saveAll(usersToSave);
        studentRepository.saveAll(studentsToSave);
        preRegistrationRepository.saveAll(preRegistrationsToSave);

        return "Đã tạo thành công " + numStudents + " sinh viên ảo và " + preRegistrationsToSave.size() + " bản ghi nguyện vọng.";
    }

    @Transactional
    public String clearSeedData() {
        List<Student> dummyStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStudentCode() != null && s.getStudentCode().startsWith("DUMMY_"))
                .toList();

        if (dummyStudents.isEmpty()) {
            return "Không tìm thấy dữ liệu giả lập nào để xóa.";
        }

        int studentCount = dummyStudents.size();
        int preRegCount = 0;

        for (Student student : dummyStudents) {
            List<PreRegistration> prs = preRegistrationRepository.findByStudentId(student.getId());
            preRegCount += prs.size();
            preRegistrationRepository.deleteAll(prs);
            
            studentRepository.delete(student);
            userRepository.delete(student.getUser());
        }

        return "Đã xóa thành công " + studentCount + " sinh viên ảo và " + preRegCount + " bản ghi nguyện vọng.";
    }
}
