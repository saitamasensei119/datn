package com.datct.datn.modules.enrollment.service;

import com.datct.datn.modules.course.entity.Semester;
import com.datct.datn.modules.course.repository.SemesterRepository;
import com.datct.datn.modules.enrollment.DTO.PreRegistrationResponse;
import com.datct.datn.modules.enrollment.entity.PreRegistration;
import com.datct.datn.modules.enrollment.repository.PreRegistrationRepository;
import com.datct.datn.modules.grade.repository.StudentSubjectResultRepository;
import com.datct.datn.modules.student.entity.Student;
import com.datct.datn.modules.student.repository.StudentRepository;
import com.datct.datn.modules.subject.entity.Subject;
import com.datct.datn.modules.subject.entity.SubjectCondition;
import com.datct.datn.modules.subject.repository.SubjectConditionRepository;
import com.datct.datn.modules.subject.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PreRegistrationService {

    @Autowired
    private PreRegistrationRepository preRegistrationRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private SemesterRepository semesterRepository;
    @Autowired
    private SubjectConditionRepository subjectConditionRepository;
    @Autowired
    private StudentSubjectResultRepository studentSubjectResultRepository;

    @Transactional
    public PreRegistrationResponse registerIntent(Long userId, Long subjectId, Long semesterId) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học kỳ"));

        if (!"OPEN".equalsIgnoreCase(semester.getStatus())) {
            throw new RuntimeException("Đợt đăng ký nguyện vọng đã đóng hoặc chưa mở.");
        }

        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));
        
        Long studentId = student.getId();

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));

        if (preRegistrationRepository.findByStudentIdAndSubjectIdAndSemesterId(studentId, subjectId, semesterId).isPresent()) {
            throw new RuntimeException("Sinh viên đã đăng ký nguyện vọng môn này rồi.");
        }

        // Kiểm tra số tín chỉ (giới hạn 25)
        Integer currentCredits = preRegistrationRepository.sumCreditsByStudentIdAndSemesterId(studentId, semesterId);
        if (currentCredits + subject.getCredits() > 25) {
            throw new RuntimeException("Số tín chỉ đăng ký vượt quá giới hạn cho phép (25 tín chỉ).");
        }

        // Kiểm tra môn tiên quyết (nếu có)
        List<SubjectCondition> conditions = subjectConditionRepository.findBySubjectId(subjectId);
        for (SubjectCondition cond : conditions) {
            if ("PREREQUISITE".equalsIgnoreCase(cond.getConditionType())) {
                boolean passed = studentSubjectResultRepository
                        .findByStudentIdAndSubjectId(studentId, cond.getRequiredSubject().getId())
                        .map(res -> res.getIsPassed())
                        .orElse(false);

                if (!passed) {
                    throw new RuntimeException("Bạn chưa học hoặc chưa qua môn tiên quyết: " + cond.getRequiredSubject().getSubjectCode() + " - " + cond.getRequiredSubject().getName());
                }
            }
        }

        PreRegistration pr = new PreRegistration();
        pr.setStudent(student);
        pr.setSubject(subject);
        pr.setSemester(semester);

        pr = preRegistrationRepository.save(pr);
        return mapToResponse(pr);
    }

    @Transactional
    public void removeIntent(Long id) {
        preRegistrationRepository.deleteById(id);
    }

    public List<PreRegistrationResponse> getMyIntents(Long userId, Long semesterId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));
        return preRegistrationRepository.findByStudentIdAndSemesterId(student.getId(), semesterId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Integer getMyTotalCredits(Long userId, Long semesterId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));
        return preRegistrationRepository.sumCreditsByStudentIdAndSemesterId(student.getId(), semesterId);
    }

    private PreRegistrationResponse mapToResponse(PreRegistration pr) {
        return PreRegistrationResponse.builder()
                .id(pr.getId())
                .studentId(pr.getStudent().getId())
                .studentCode(pr.getStudent().getStudentCode())
                .studentName(pr.getStudent().getUser().getFullName())
                .subjectId(pr.getSubject().getId())
                .subjectCode(pr.getSubject().getSubjectCode())
                .subjectName(pr.getSubject().getName())
                .credits(pr.getSubject().getCredits())
                .semesterId(pr.getSemester().getId())
                .createdAt(pr.getCreatedAt())
                .build();
    }
}
