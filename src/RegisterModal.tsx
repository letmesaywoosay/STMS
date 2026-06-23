/* eslint-disable */
// RegisterModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 단계별 진입형 회원가입 컴포넌트
//  Step 1 : 회원 유형 선택 (파트너사 / 내부 임직원)
//  Step 2 : 유형별 정보 입력 폼
//  Step 3 : 가입 완료 안내
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, CSSProperties } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TypeScript 타입 정의
// ═══════════════════════════════════════════════════════════════════════════════

type MemberType = 'partner' | 'employee';
type Step = 1 | 2 | 3;

interface RegisterFormData {
  userId: string;          // 로그인 아이디 (이메일 대신 사용)
  password: string;
  passwordConfirm: string;
  jobType: string;
  companyName: string;
  division: string;
  team: string;
}

interface RegisterModalProps {
  onClose: () => void;
  onRegister: (payload: RegisterFormData & { memberType: MemberType }) => Promise<void>;
  externalErr?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 상수 데이터
// ═══════════════════════════════════════════════════════════════════════════════

const JOB_TYPES: string[] = [
  '기획자', '개발자', '운영자', '디자이너', '영업/마케터', '관리자', '데이터 분석가', '기타',
];

const DIVISION_TEAM_MAP: Record<string, string[]> = {
  '아카데미팀':    ['교육기획파트', '교육운영파트'],
  '영업본부':      ['기업영업팀', '파트너영업팀', '솔루션영업팀'],
  '기술본부':      ['플랫폼개발팀', '인프라팀', 'AI개발팀', 'DevOps팀'],
  '제품본부':      ['제품기획팀', 'UX디자인팀', '품질관리팀'],
  '경영지원본부':  ['인사팀', '재무팀', '법무팀', '총무팀'],
};

const MEMBER_TYPE_CARDS = [
  {
    type: 'partner' as MemberType,
    icon: '🤝',
    title: '파트너사 회원가입',
    description: 'AIDA OASIS 솔루션 도입 및\n기술 지원을 담당하시는 협력사 분들',
    badge: '외부 협력사',
    badgeColor: '#0d74ce',
    badgeBg: '#e8f3fb',
  },
  {
    type: 'employee' as MemberType,
    icon: '🏢',
    title: '내부 임직원 회원가입',
    description: '오케스트로 소속 임직원 분들\n(@okestro.com 이메일 즉시 승인)',
    badge: '내부 임직원',
    badgeColor: '#16a34a',
    badgeBg: '#dcfce7',
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 공통 스타일
// ═══════════════════════════════════════════════════════════════════════════════

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid var(--hairline-strong)',
  borderRadius: 'var(--rounded-md)',
  fontSize: '14px',
  color: 'var(--ink)',
  background: 'var(--canvas)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'var(--sans)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--ink)',
  marginBottom: '6px',
};

const requiredMark = (
  <span style={{ color: 'var(--semantic-error)', marginLeft: '2px' }}>*</span>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1: 유형 선택 화면
// ═══════════════════════════════════════════════════════════════════════════════

interface TypeSelectorProps {
  onSelect: (type: MemberType) => void;
}

const TypeSelector: React.FC<TypeSelectorProps> = ({ onSelect }) => {
  const [hoveredType, setHoveredType] = useState<MemberType | null>(null);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👤</div>
        <h3 style={{
          fontSize: '22px', fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.5px', marginBottom: '8px',
        }}>
          회원 유형을 선택해 주세요
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.6 }}>
          가입 유형에 따라 입력 정보가 달라집니다.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {MEMBER_TYPE_CARDS.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            onMouseEnter={() => setHoveredType(card.type)}
            onMouseLeave={() => setHoveredType(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              width: '100%', padding: '20px',
              background: hoveredType === card.type ? 'var(--canvas-soft)' : 'var(--canvas)',
              border: hoveredType === card.type
                ? '2px solid var(--primary)'
                : '2px solid var(--hairline-strong)',
              borderRadius: 'var(--rounded-lg)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.18s ease',
              transform: hoveredType === card.type ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: hoveredType === card.type
                ? '0 4px 16px rgba(0,0,0,0.08)'
                : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'var(--surface-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', flexShrink: 0,
            }}>
              {card.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
                  {card.title}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: card.badgeColor, background: card.badgeBg,
                  padding: '2px 8px', borderRadius: 'var(--rounded-pill)', flexShrink: 0,
                }}>
                  {card.badge}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
                {card.description}
              </p>
            </div>

            <span style={{
              fontSize: '18px', color: 'var(--muted)', flexShrink: 0,
              transition: 'transform 0.18s',
              transform: hoveredType === card.type ? 'translateX(3px)' : 'translateX(0)',
            }}>→</span>
          </button>
        ))}
      </div>

      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 'var(--rounded-md)', padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', gap: '8px',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>ℹ️</span>
        <p style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.6, margin: 0 }}>
          <strong>고객사 회원분들은 별도의 회원가입 없이 교육 신청이 가능합니다.</strong><br />
          교육 신청 시 담당자 정보를 직접 입력하시면 됩니다.
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2: 정보 입력 폼
// ═══════════════════════════════════════════════════════════════════════════════

interface InfoFormProps {
  memberType: MemberType;
  formData: RegisterFormData;
  onChange: (key: keyof RegisterFormData, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

const selectStyle = (hasValue: boolean): CSSProperties => ({
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360646c' stroke-width='2'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '16px',
  paddingRight: '36px',
  color: hasValue ? 'var(--ink)' : 'var(--muted)',
});

const InfoForm: React.FC<InfoFormProps> = ({
  memberType, formData, onChange, onBack, onSubmit, isLoading, error,
}) => {
  const availableTeams: string[] = formData.division
    ? (DIVISION_TEAM_MAP[formData.division] ?? [])
    : [];

  const isPartner = memberType === 'partner';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--body)',
            fontSize: '13px', cursor: 'pointer', padding: '0 0 16px 0',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          ← 유형 선택으로 돌아가기
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>{isPartner ? '🤝' : '🏢'}</span>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.4px' }}>
            {isPartner ? '파트너사' : '내부 임직원'} 정보 입력
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--body)' }}>
          필수 항목(<span style={{ color: 'var(--semantic-error)' }}>*</span>)을 모두 입력해 주세요.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 공통: 아이디 */}
        <div>
          <label style={labelStyle}>아이디 {requiredMark}</label>
          <input
            type="text" value={formData.userId}
            onChange={(e) => onChange('userId', e.target.value)}
            placeholder="사용하실 아이디를 입력해 주세요"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
          />
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            영문, 숫자, 특수문자(_.-) 조합으로 4자 이상 입력해 주세요.
          </p>
        </div>

        {/* 공통: 비밀번호 */}
        <div>
          <label style={labelStyle}>비밀번호 {requiredMark}</label>
          <input
            type="password" value={formData.password}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder="6자 이상 입력해 주세요"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
          />
        </div>

        {/* 공통: 비밀번호 확인 */}
        <div>
          <label style={labelStyle}>비밀번호 확인 {requiredMark}</label>
          <input
            type="password" value={formData.passwordConfirm}
            onChange={(e) => onChange('passwordConfirm', e.target.value)}
            placeholder="비밀번호를 다시 입력해 주세요"
            style={{
              ...inputStyle,
              borderColor: formData.passwordConfirm && formData.password !== formData.passwordConfirm
                ? 'var(--semantic-error)' : 'var(--hairline-strong)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e)  => {
              e.currentTarget.style.borderColor =
                formData.passwordConfirm && formData.password !== formData.passwordConfirm
                  ? 'var(--semantic-error)' : 'var(--hairline-strong)';
            }}
          />
          {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
            <p style={{ fontSize: '12px', color: 'var(--semantic-error)', marginTop: '4px' }}>
              ⚠️ 비밀번호가 일치하지 않습니다.
            </p>
          )}
          {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
            <p style={{ fontSize: '12px', color: 'var(--semantic-success)', marginTop: '4px' }}>
              ✓ 비밀번호가 일치합니다.
            </p>
          )}
        </div>

        {/* 공통: 직군 */}
        <div>
          <label style={labelStyle}>직군 {requiredMark}</label>
          <select
            value={formData.jobType}
            onChange={(e) => onChange('jobType', e.target.value)}
            style={selectStyle(!!formData.jobType)}
          >
            <option value="" disabled>직군을 선택해 주세요</option>
            {JOB_TYPES.map((jt) => (
              <option key={jt} value={jt}>{jt}</option>
            ))}
          </select>
        </div>

        {/* 파트너사 전용: 파트너사명 */}
        {isPartner && (
          <div>
            <label style={labelStyle}>파트너사명 {requiredMark}</label>
            <input
              type="text" value={formData.companyName}
              onChange={(e) => onChange('companyName', e.target.value)}
              placeholder="예) ㈜클라우드원, ㈜넥스트시스템즈"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
            />
          </div>
        )}

        {/* 내부 임직원 전용: 본부명 + 팀명 */}
        {!isPartner && (
          <>
            {/* 본부명 */}
            <div>
              <label style={labelStyle}>본부명 {requiredMark}</label>
              <select
                value={formData.division}
                onChange={(e) => {
                  // 본부 변경 시 팀명 초기화
                  onChange('division', e.target.value);
                  onChange('team', '');
                }}
                style={selectStyle(!!formData.division)}
              >
                <option value="" disabled>본부를 선택해 주세요</option>
                {Object.keys(DIVISION_TEAM_MAP).map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* 팀명: 본부 선택 후 동적 활성화 */}
            <div>
              <label style={labelStyle}>팀명 {requiredMark}</label>
              <select
                value={formData.team}
                onChange={(e) => onChange('team', e.target.value)}
                disabled={!formData.division}
                style={{
                  ...selectStyle(!!formData.team),
                  opacity: !formData.division ? 0.5 : 1,
                  cursor: !formData.division ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="" disabled>
                  {formData.division ? '팀을 선택해 주세요' : '본부를 먼저 선택해 주세요'}
                </option>
                {availableTeams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {!formData.division && (
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  본부를 먼저 선택하면 팀 목록이 표시됩니다.
                </p>
              )}
            </div>
          </>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 'var(--rounded-md)', padding: '10px 12px',
            fontSize: '13px', color: '#dc2626', fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          onClick={onSubmit}
          disabled={isLoading}
          style={{
            width: '100%', padding: '13px',
            background: isLoading ? 'var(--muted-soft)' : 'var(--primary)',
            color: 'var(--on-primary)', border: 'none',
            borderRadius: 'var(--rounded-md)',
            fontSize: '15px', fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s', letterSpacing: '-0.2px',
          }}
          onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.background = 'var(--primary-active)'; }}
          onMouseOut={(e)  => { if (!isLoading) e.currentTarget.style.background = 'var(--primary)'; }}
        >
          {isLoading ? '가입 신청 처리 중...' : `${isPartner ? '파트너사' : '내부 임직원'} 가입 신청`}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3: 가입 완료 화면
// ═══════════════════════════════════════════════════════════════════════════════

interface SuccessScreenProps {
  memberType: MemberType;
  userId: string;
  isAutoApproved: boolean;
  onGoToLogin: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  memberType, userId, isAutoApproved, onGoToLogin,
}) => (
  <div style={{ textAlign: 'center', padding: '8px 0' }}>
    <div style={{
      width: '72px', height: '72px', borderRadius: '50%',
      background: isAutoApproved ? '#dcfce7' : '#dbeafe',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '32px', margin: '0 auto 20px',
    }}>
      {isAutoApproved ? '✅' : '📋'}
    </div>

    <h3 style={{
      fontSize: '20px', fontWeight: 700, color: 'var(--ink)',
      marginBottom: '12px', letterSpacing: '-0.4px',
    }}>
      {isAutoApproved ? '가입이 완료되었습니다!' : '가입 신청이 접수되었습니다!'}
    </h3>

    <div style={{
      background: 'var(--canvas-soft)', border: '1px solid var(--hairline)',
      borderRadius: 'var(--rounded-lg)', padding: '16px',
      marginBottom: '24px', textAlign: 'left',
    }}>
      {isAutoApproved ? (
        <>
          <p style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600, marginBottom: '6px' }}>
            🎉 즉시 로그인 가능합니다.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.6 }}>
            <strong>{userId}</strong> 아이디로 바로 로그인하실 수 있습니다.
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600, marginBottom: '6px' }}>
            📬 관리자 승인 후 로그인이 가능합니다.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: 1.6 }}>
            <strong>{userId}</strong> 아이디로 신청이 접수되었습니다.<br />
            {memberType === 'partner'
              ? '파트너사 회원은 담당 관리자 검토 후 1~2 영업일 내에 승인됩니다.'
              : '관리자 확인 후 계정이 활성화됩니다.'
            }
          </p>
        </>
      )}
    </div>

    <button
      onClick={onGoToLogin}
      style={{
        width: '100%', padding: '13px',
        background: 'var(--primary)', color: 'var(--on-primary)',
        border: 'none', borderRadius: 'var(--rounded-md)',
        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary-active)'; }}
      onMouseOut={(e)  => { e.currentTarget.style.background = 'var(--primary)'; }}
    >
      로그인하러 가기
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 단계 인디케이터
// ═══════════════════════════════════════════════════════════════════════════════

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: '유형 선택' },
    { num: 2, label: '정보 입력' },
    { num: 3, label: '완료'     },
  ] as const;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px' }}>
      {steps.map((s, idx) => {
        const isDone   = currentStep > s.num;
        const isActive = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                background: (isDone || isActive) ? 'var(--primary)' : 'var(--surface-strong)',
                color: (isDone || isActive) ? 'var(--on-primary)' : 'var(--muted)',
                transition: 'all 0.25s',
              }}>
                {isDone ? '✓' : s.num}
              </div>
              <span style={{
                fontSize: '11px', whiteSpace: 'nowrap',
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                fontWeight: isActive ? 600 : 400,
              }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                width: '48px', height: '2px', marginBottom: '18px',
                background: currentStep > s.num ? 'var(--primary)' : 'var(--hairline-strong)',
                transition: 'background 0.25s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 메인 RegisterModal
// ═══════════════════════════════════════════════════════════════════════════════

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onRegister, externalErr = '' }) => {
  const [step, setStep]               = useState<Step>(1);
  const [memberType, setMemberType]   = useState<MemberType | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [internalErr, setInternalErr] = useState('');
  const [isAutoApproved, setIsAutoApproved] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    userId: '', password: '', passwordConfirm: '',
    jobType: '', companyName: '', division: '', team: '',
  });

  const handleChange = (key: keyof RegisterFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setInternalErr('');
  };

  // Step 1 → 2: 유형 선택
  const handleTypeSelect = (type: MemberType): void => {
    setMemberType(type);
    setStep(2);
  };

  // 유효성 검사
  const validate = (): boolean => {
    const { userId, password, passwordConfirm, jobType, companyName, division, team } = formData;
    if (!userId.trim())                                         { setInternalErr('아이디를 입력해 주세요.');                          return false; }
    if (userId.trim().length < 4)                               { setInternalErr('아이디는 4자 이상이어야 합니다.');                   return false; }
    if (/\s/.test(userId.trim()))                               { setInternalErr('아이디에 공백을 사용할 수 없습니다.');               return false; }
    if (!password.trim())                                       { setInternalErr('비밀번호를 입력해 주세요.');                         return false; }
    if (password.length < 6)                                    { setInternalErr('비밀번호는 6자 이상이어야 합니다.');                  return false; }
    if (password !== passwordConfirm)                           { setInternalErr('비밀번호와 비밀번호 확인이 일치하지 않습니다.');       return false; }
    if (!jobType)                                               { setInternalErr('직군을 선택해 주세요.');                            return false; }
    if (memberType === 'partner' && !companyName.trim())        { setInternalErr('파트너사명을 입력해 주세요.');                       return false; }
    if (memberType === 'employee' && !division)                 { setInternalErr('본부명을 선택해 주세요.');                          return false; }
    if (memberType === 'employee' && !team)                     { setInternalErr('팀명을 선택해 주세요.');                            return false; }
    return true;
  };

  // Step 2 → 3: 제출
  const handleSubmit = async (): Promise<void> => {
    if (!memberType || !validate()) return;
    setIsLoading(true);
    setInternalErr('');
    try {
      await onRegister({ ...formData, memberType });
      // 내부 임직원은 즉시 승인, 파트너사는 관리자 승인 대기
      setIsAutoApproved(memberType === 'employee');
      setStep(3);
    } catch (e: unknown) {
      setInternalErr(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayErr = internalErr || externalErr;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--rounded-xl)',
        padding: '36px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid var(--hairline)',
        position: 'relative', boxSizing: 'border-box',
        animation: 'regModalIn 0.22s ease',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', fontSize: '20px',
            color: 'var(--muted)', cursor: 'pointer', padding: '4px',
            lineHeight: 1, borderRadius: 'var(--rounded-sm)', transition: 'color 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseOut={(e)  => { e.currentTarget.style.color = 'var(--muted)'; }}
          aria-label="닫기"
        >✕</button>

        <StepIndicator currentStep={step} />

        {step === 1 && <TypeSelector onSelect={handleTypeSelect} />}

        {step === 2 && memberType && (
          <InfoForm
            memberType={memberType}
            formData={formData}
            onChange={handleChange}
            onBack={() => { setStep(1); setMemberType(null); setInternalErr(''); }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={displayErr}
          />
        )}

        {step === 3 && (
          <SuccessScreen
            memberType={memberType!}
            userId={formData.userId}
            isAutoApproved={isAutoApproved}
            onGoToLogin={onClose}
          />
        )}
      </div>

      <style>{`
        @keyframes regModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default RegisterModal;
export type { MemberType, RegisterFormData, RegisterModalProps };
