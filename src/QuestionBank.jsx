import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

// ── 공통 디자인 토큰 (미니멀리즘 & 플랫 디자인 2.0 시스템) ──
const C = {
  bg: "var(--canvas)",
  surface: "var(--canvas)",
  surfaceCard: "var(--surface-card)",
  border: "var(--hairline)",
  borderActive: "var(--primary)",
  blue: "var(--text-link)",
  blueMid: "var(--primary)",
  indigo: "var(--accent-preview)",
  purple: "var(--accent-preview)",
  purpleLight: "#a78bfa",
  teal: "#14b8a6",
  green: "var(--semantic-success)",
  red: "var(--semantic-error)",
  amber: "var(--accent-warning)",
  text: "var(--ink)",
  subtle: "var(--body)",
  muted: "var(--muted)",
};

const boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)";
const shadowLg = "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)";

// ── 1. 오케스트로 솔루션 지식 베이스 사전 탑재 (Mock Source Documents) ──
const INITIAL_DOCUMENTS = {
  contrabass: [
    {
      id: "cb_doc_1",
      title: "CONTRABASS 아키텍처 개요",
      content: `콘트라베이스(CONTRABASS)는 오케스트로의 핵심적인 서버 가상화 플랫폼(IaaS) 솔루션입니다. 오픈스택(OpenStack) 오픈소스 커뮤니티 엔진을 기반으로 설계되었으며, 안정적인 KVM 하이퍼바이저 가상화 기술을 제공하여 기존 상용 솔루션(VMware vSphere)을 효과적으로 대체합니다.
콘트라베이스 아키텍처는 가상 머신의 라이프사이클을 제어하는 컨트롤러 노드, 실제 가상 머신이 기동되는 컴퓨트 노드, 그리고 가상 스토리지를 공급하는 스토리지 노드로 분리되어 고가용성(HA)을 제공합니다. 가상 스위치 제어를 위해 가상화 환경 표준인 Open vSwitch(OVS)를 기본 탑재하고 있어 가상 머신 간 트래픽 격리 및 VXLAN 기반 오버레이 네트워크 통신을 완벽하게 보장합니다.
장애 상황 발생 시 가상 머신 서비스의 중단을 최소화하기 위해 Pacemaker와 Corosync 기반의 가상화 고가용성(HA) 엔진을 탑재하고 있어 컨트롤러 노드 장애 시 즉각적인 투표(Quorum) 정족수 달성 및 가상 머신 자동 페일오버(Failover)를 수행합니다.`,
    },
    {
      id: "cb_doc_2",
      title: "CONTRABASS 설치 및 마이그레이션 가이드",
      content: `콘트라베이스 설치의 하드웨어 기본 사양은 마스터/컨트롤러 노드의 경우 최소 8코어 CPU, 32GB RAM, 100GB 디스크 공간을 권장합니다. 설치 네트워크 아키텍처는 클라우드 관리 및 제어용 Management 네트워크, 가상 스토리지 트래픽용 Storage 네트워크, 가상 머신 간 통신용 VM/Data 네트워크로 물리적 또는 VLAN 기반으로 분리 설계되어야 합니다.
설치는 'contrabass-deploy' 유틸리티를 사용하여 Ansible 플레이북 기반으로 컨트롤러 및 컴퓨트 노드의 롤 배포를 자동화합니다. 설치가 완료된 후에는 'openstack service list' 명령을 통해 Nova, Neutron, Cinder 등 핵심 가상화 구성요소들의 가동 상태를 검증합니다.
콘트라베이스는 기존 레거시 인프라 마이그레이션을 지원하기 위해 V2C(VMware to Contrabass) 변환 도구를 기본 내장하고 있습니다. V2C 도구는 VMware의 VMDK 디스크 이미지를 콘트라베이스 표준 이미지 포맷인 QCOW2 포맷으로 라이브 변환하고, vSwitch 포트그룹 정보를 Neutron 가상 네트워크 포트 정보로 일관성 있게 변환하여 다운타임을 수 분 이내로 단축시킵니다.`,
    },
  ],
  viola: [
    {
      id: "vl_doc_1",
      title: "VIOLA 컨테이너 플랫폼 운영 가이드",
      content: `비올라(VIOLA)는 쿠버네티스(Kubernetes) 엔진을 코어로 채택한 오케스트로의 클라우드 네이티브 PaaS 컨테이너 관리 플랫폼입니다. 단일 제어 포털에서 온프레미스 및 프라이빗/퍼블릭 클라우드 전반의 멀티 쿠버네티스 클러스터를 중앙 집중적으로 프로비저닝하고 관리합니다.
비올라는 다중 테넌트(Multi-tenant) 환경에서 워크로드 보안과 격리를 위해 네임스페이스 수준의 격리 및 쿠버네티스 RBAC(역할 기반 접근 제어) 모델을 기본 제공하여, 개발자 및 운영자의 권한 범위를 명확히 제한합니다. 트래픽 마이크로제어 및 라우팅 가시성을 강화하기 위해 Istio 서비스 메쉬(Service Mesh)를 네이티브하게 결합하고 있습니다. 이를 통해 컨테이너 간 모든 게이트웨이 및 암호화 통신을 실시간 토폴로지 맵으로 모니터링할 수 있습니다.
파드의 부하 분산을 위해서는 CPU 및 메모리 사용량 기반의 HPA(Horizontal Pod Autoscaler) 뿐만 아니라, 사용자 정의 프로메테우스 메트릭을 기반으로 파드 개수를 자동 스케일링하는 고급 자동화 스케일 아웃 정책을 구축하여 서비스 탄력성을 높입니다.`,
    },
  ],
  symphony: [
    {
      id: "sp_doc_1",
      title: "SYMPHONY A.I. 운영 분석 및 최적화 매뉴얼",
      content: `심포니 A.I.(SYMPHONY A.I.)는 대규모 하이브리드 클라우드 자원의 최적화 및 지능형 운영 관리를 수행하는 오케스트로의 AIOps 솔루션입니다. 프라이빗과 퍼블릭 클라우드의 서버 성능 데이터(CPU, RAM, Disk, Traffic)와 비정상 이벤트 로그를 실시간으로 수집하고 분석합니다.
심포니 A.I.는 시계열 성능 지표 분석을 위해 딥러닝 기반 LSTM(Long Short-Term Memory) 알고리즘 및 오토인코더(Autoencoder) 인공신경망을 활용해 성능 임계치를 동적으로 예측합니다. 이를 통해 서버 가상 머신의 CPU 사용률 비정상 상승이나 메모리 누수 같은 장애 발생 징후를 골든타임 이전에 감지하는 지능형 이상 징후 감지(Anomaly Detection)를 수행합니다.
또한, 장애 로그 분석을 결합하여 근본 원인을 추적하는 RCA(Root Cause Analysis) 시스템을 탑재하여 어떤 구성요소에 병목이 발생했는지 시각화합니다. 클라우드 비용 효율화를 위해 과다 할당된 자원을 축소하는 라이트사이징(Right-sizing) 크기 조정 추천 알고리즘을 실행하여 CPU/메모리 오버헤드를 줄이고 예산을 절감할 수 있는 실무 리포트를 자동으로 보고서화합니다.`,
    },
  ],
  clarinet: [
    {
      id: "cl_doc_1",
      title: "CLARINET 생성형 AI 비즈니스 서비스 안내",
      content: `클라리넷(CLARINET)은 기업 내 비즈니스 지식을 이해하고 안전하게 업무에 AI를 적용하기 위한 오케스트로의 엔터프라이즈 생성형 AIaaS 솔루션입니다. 보안이 중요한 기업 환경에 맞춤형 대규모 언어 모델(LLM)을 사내 인프라(On-Premise)에 구축할 수 있도록 지원합니다.
클라리넷의 핵심 아키텍처는 RAG(Retrieval-Augmented Generation, 검색 증강 생성) 아키텍처를 기반으로 설계되었습니다. 이는 사용자의 질문을 기반으로 사내의 축적된 규정 및 매뉴얼 데이터를 먼저 검색한 뒤, 검색된 지식을 컨텍스트로 LLM에 주입하여 거짓 답변(Hallucination) 현상을 완전히 배제합니다.
RAG의 고성능 유사도 검색을 위해 대규모 비정형 문서를 토큰화한 뒤, Milvus 또는 pgvector 같은 고성능 벡터 데이터베이스(Vector DB)에 고차원 임베딩 벡터로 정렬 및 인덱싱을 수행합니다. 또한, 질문 히스토리의 캐싱 처리를 통해 API 비용을 획기적으로 줄이고 개인정보 및 민감 데이터를 필터링하는 데이터 세이프티 가드레일 기능을 내장하고 있습니다.`,
    },
  ],
};

// ── 2. AI 출제용 사전 정의 문제 데이터베이스 (Mock Auto-Gen Pool) ──
const PREDEFINED_QUESTIONS = [
  // Contrabass
  {
    id: "q_cb_1",
    solution: "contrabass",
    type: "choice",
    difficulty: "easy",
    question: "콘트라베이스(CONTRABASS)의 핵심이 되는 서버 가상화 하이퍼바이저 기술은 무엇인가요?",
    options: ["KVM (Kernel-based Virtual Machine)", "Xen Hypervisor", "Hyper-V", "VirtualBox"],
    answer: "KVM (Kernel-based Virtual Machine)",
    explanation: "콘트라베이스 아키텍처에 따르면, 안정적인 KVM 하이퍼바이저 가상화 기술을 기반으로 설계되어 기존 VMware vSphere를 효율적으로 대체합니다.",
    citationDocId: "cb_doc_1",
    citationText: "안정적인 KVM 하이퍼바이저 가상화 기술을 제공하여 기존 상용 솔루션(VMware vSphere)을 효과적으로 대체합니다.",
  },
  {
    id: "q_cb_2",
    solution: "contrabass",
    type: "tf",
    difficulty: "easy",
    question: "콘트라베이스는 기존 VMware 가상 머신(VM) 디스크 및 네트워크 구성을 콘트라베이스 표준인 QCOW2 등으로 라이브 변환하는 V2C 도구를 내장하고 있다.",
    options: ["O", "X"],
    answer: "O",
    explanation: "V2C(VMware to Contrabass) 도구는 VMDK 디스크 이미지를 QCOW2 포맷으로 라이브 변환하고 다운타임을 대폭 감소시키는 역할을 내장하고 있습니다.",
    citationDocId: "cb_doc_2",
    citationText: "V2C(VMware to Contrabass) 변환 도구를 기본 내장하고 있습니다. V2C 도구는 VMware의 VMDK 디스크 이미지를 콘트라베이스 표준 이미지 포맷인 QCOW2 포맷으로 라이브 변환하고",
  },
  {
    id: "q_cb_3",
    solution: "contrabass",
    type: "choice",
    difficulty: "medium",
    question: "콘트라베이스 네트워크 통신 제어 및 VXLAN 기반 오버레이 네트워크 구성을 위해 기본 탑재된 가상 스위치 솔루션은 무엇인가요?",
    options: ["Open vSwitch (OVS)", "Linux Bridge", "Cisco Nexus 1000V", "Calico vRouter"],
    answer: "Open vSwitch (OVS)",
    explanation: "콘트라베이스는 가상화 환경 표준인 Open vSwitch(OVS)를 기본 탑재하고 있어 가상 머신 간 격리와 VXLAN 오버레이 통신을 구현합니다.",
    citationDocId: "cb_doc_1",
    citationText: "가상 스위치 제어를 위해 가상화 환경 표준인 Open vSwitch(OVS)를 기본 탑재하고 있어 가상 머신 간 트래픽 격리 및 VXLAN 기반 오버레이 네트워크 통신을 완벽하게 보장합니다.",
  },
  {
    id: "q_cb_4",
    solution: "contrabass",
    type: "short",
    difficulty: "medium",
    question: "콘트라베이스 고가용성(HA) 엔진에서 클러스터 상태를 동기화하고 투표(Quorum) 정족수를 달성하기 위해 사용하는 솔루션 중 하나를 적으시오.",
    answer: "Pacemaker",
    explanation: "장애 발생 시 서비스 중단을 최소화하기 위해 Pacemaker와 Corosync 기반의 가상화 고가용성(HA) 엔진을 탑재하고 있습니다.",
    citationDocId: "cb_doc_1",
    citationText: "Pacemaker와 Corosync 기반의 가상화 고가용성(HA) 엔진을 탑재하고 있어 컨트롤러 노드 장애 시 즉각적인 투표(Quorum) 정족수 달성 및 가상 머신 자동 페일오버(Failover)를 수행합니다.",
  },
  {
    id: "q_cb_5",
    solution: "contrabass",
    type: "essay",
    difficulty: "hard",
    question: "콘트라베이스 가상화 환경 구축을 위한 네트워크 인터페이스의 3가지 핵심 아키텍처 분류와 각각의 용도를 서술하시오.",
    answer: "Management(클라우드 관리 및 제어용), Storage(가상 스토리지 트래픽용), VM/Data(가상 머신 간 통신용) 네트워크로 분리 설계해야 합니다.",
    explanation: "설치 가이드에 따르면 클라우드 제어용 Management, 가상 스토리지용 Storage, VM 간 통신용 VM/Data(Data) 네트워크 분류로 나누어 상호 영향을 미치지 않도록 구성합니다.",
    citationDocId: "cb_doc_2",
    citationText: "클라우드 관리 및 제어용 Management 네트워크, 가상 스토리지 트래픽용 Storage 네트워크, 가상 머신 간 통신용 VM/Data 네트워크로 물리적 또는 VLAN 기반으로 분리 설계되어야 합니다.",
  },
  // Viola
  {
    id: "q_vl_1",
    solution: "viola",
    type: "choice",
    difficulty: "easy",
    question: "비올라(VIOLA) 컨테이너 플랫폼의 기반이 되는 핵심 컨테이너 오케스트레이션 엔진은 무엇인가요?",
    options: ["Kubernetes", "Docker Swarm", "Apache Mesos", "OpenShift Container Platform"],
    answer: "Kubernetes",
    explanation: "비올라는 쿠버네티스(Kubernetes) 엔진을 코어로 채택하여 설계된 클라우드 네이티브 PaaS 플랫폼입니다.",
    citationDocId: "vl_doc_1",
    citationText: "비올라(VIOLA)는 쿠버네티스(Kubernetes) 엔진을 코어로 채택한 오케스트로의 클라우드 네이티브 PaaS 컨테이너 관리 플랫폼입니다.",
  },
  {
    id: "q_vl_2",
    solution: "viola",
    type: "tf",
    difficulty: "medium",
    question: "비올라(VIOLA) 플랫폼은 마이크로서비스 간 트래픽 제어 및 가시성 강화를 위해 Istio 서비스 메쉬(Service Mesh)를 네이티브하게 결합하고 있다.",
    options: ["O", "X"],
    answer: "O",
    explanation: "설명에 따르면, 마이크로제어 및 가우팅 가시성을 강화하기 위해 Istio 서비스 메쉬를 결합하여 실시간 토폴로지 맵을 제공합니다.",
    citationDocId: "vl_doc_1",
    citationText: "트래픽 마이크로제어 및 라우팅 가시성을 강화하기 위해 Istio 서비스 메쉬(Service Mesh)를 네이티브하게 결합하고 있습니다. 이를 통해 컨테이너 간 모든 게이트웨이 및 암호화 통신을 실시간 토폴로지 맵으로 모니터링할 수 있습니다.",
  },
  {
    id: "q_vl_3",
    solution: "viola",
    type: "choice",
    difficulty: "medium",
    question: "비올라에서 여러 클러스터에 걸쳐 부하가 증가할 때 파드(Pod)의 수평 스케일 아웃을 자동 제어하는 핵심 자원 객체는 무엇인가요?",
    options: ["HPA (Horizontal Pod Autoscaler)", "VPA (Vertical Pod Autoscaler)", "DaemonSet", "Cluster Autoscaler"],
    answer: "HPA (Horizontal Pod Autoscaler)",
    explanation: "비올라는 CPU 및 메모리 사용량 기반의 HPA(Horizontal Pod Autoscaler) 정책 및 커스텀 프로메테우스 스케일링 정책을 지원합니다.",
    citationDocId: "vl_doc_1",
    citationText: "CPU 및 메모리 사용량 기반의 HPA(Horizontal Pod Autoscaler) 뿐만 아니라, 사용자 정의 프로메테우스 메트릭을 기반으로 파드 개수를 자동 스케일링하는 고급 자동화 스케일 아웃 정책을 구축하여",
  },
  {
    id: "q_vl_4",
    solution: "viola",
    type: "short",
    difficulty: "hard",
    question: "비올라 다중 테넌트 환경에서 계정 역할별로 API 리소스의 접근 권한을 선언적으로 제어하는 모델의 약칭은 무엇인가요?",
    answer: "RBAC",
    explanation: "쿠버네티스 RBAC(Role-Based Access Control, 역할 기반 접근 제어) 모델을 활용하여 보안과 다중 테넌시 격리를 수행합니다.",
    citationDocId: "vl_doc_1",
    citationText: "워크로드 보안과 격리를 위해 네임스페이스 수준의 격리 및 쿠버네티스 RBAC(역할 기반 접근 제어) 모델을 기본 제공하여,",
  },
  // Symphony AI
  {
    id: "q_sp_1",
    solution: "symphony",
    type: "choice",
    difficulty: "easy",
    question: "심포니 A.I.(SYMPHONY A.I.)는 가상화 자원 통합 모니터링 및 성능 예측을 수행하는 어떤 기술 영역에 속하는 솔루션인가요?",
    options: ["AIOps", "DevOps", "BlockChain", "BI (Business Intelligence)"],
    answer: "AIOps",
    explanation: "심포니 A.I.는 하이브리드 클라우드 자원의 최적화 및 지능형 운영 관리를 수행하는 오케스트로의 대표적인 AIOps 솔루션입니다.",
    citationDocId: "sp_doc_1",
    citationText: "대규모 하이브리드 클라우드 자원의 최적화 및 지능형 운영 관리를 수행하는 오케스트로의 AIOps 솔루션입니다.",
  },
  {
    id: "q_sp_2",
    solution: "symphony",
    type: "choice",
    difficulty: "medium",
    question: "심포니 A.I.의 이상 징후 감지(Anomaly Detection)를 위한 시계열 성능 지표 예측에 사용되는 대표적인 순환 신경망 모델은?",
    options: ["LSTM (Long Short-Term Memory)", "CNN (Convolutional Neural Network)", "SVM", "K-Means Clustering"],
    answer: "LSTM (Long Short-Term Memory)",
    explanation: "임계치 예측과 비정상 패턴 인지를 위해 시계열 분석에 탁월한 LSTM 알고리즘과 오토인코더 인공신경망을 결합해 사용합니다.",
    citationDocId: "sp_doc_1",
    citationText: "시계열 성능 지표 분석을 위해 딥러닝 기반 LSTM(Long Short-Term Memory) 알고리즘 및 오토인코더(Autoencoder) 인공신경망을 활용해 성능 임계치를 동적으로 예측합니다.",
  },
  {
    id: "q_sp_3",
    solution: "symphony",
    type: "short",
    difficulty: "hard",
    question: "클라우드 비용 낭비를 방지하기 위해 심포니 A.I.에서 과다 할당 자원을 재탐지하여 최적의 크기를 추천하는 전략의 영문 명칭은 무엇인가요?",
    answer: "Rightsizing",
    explanation: "과다 할당된 자원을 축소하는 라이트사이징(Right-sizing) 크기 조정 추천 알고리즘을 통해 리소스를 절감합니다.",
    citationDocId: "sp_doc_1",
    citationText: "클라우드 비용 효율화를 위해 과다 할당된 자원을 축소하는 라이트사이징(Right-sizing) 크기 조정 추천 알고리즘을 실행하여 CPU/메모리 오버헤드를 줄이고",
  },
  {
    id: "q_sp_4",
    solution: "symphony",
    type: "essay",
    difficulty: "medium",
    question: "심포니 A.I.의 RCA(Root Cause Analysis) 기능에 대해 설명하고 그것이 장점인 이유를 기술하시오.",
    answer: "장애 로그 분석을 결합하여 복잡한 자원 간의 병목 현상의 근본 원인을 추적하고 그래픽으로 시각화하여 운영자가 신속하게 조치할 수 있게 돕습니다.",
    explanation: "RCA는 시스템 오류 및 경보의 본래 원인이 무엇인지 연쇄 경로를 찾아가 병목 지점을 시각화해 줌으로써 수동 대조 시간을 획기적으로 낮춰 줍니다.",
    citationDocId: "sp_doc_1",
    citationText: "장애 로그 분석을 결합하여 근본 원인을 추적하는 RCA(Root Cause Analysis) 시스템을 탑재하여 어떤 구성요소에 병목이 발생했는지 시각화합니다.",
  },
  // Clarinet
  {
    id: "q_cl_1",
    solution: "clarinet",
    type: "choice",
    difficulty: "medium",
    question: "클라리넷(CLARINET)에서 생성형 AI의 가장 큰 단점인 거짓 답변(환각 현상)을 해결하기 위해 사용하는 기업 지식 문서 기반의 검색 보완 기술은?",
    options: ["RAG (Retrieval-Augmented Generation)", "Fine-Tuning", "Reinforcement Learning", "Zero-Shot Prompting"],
    answer: "RAG (Retrieval-Augmented Generation)",
    explanation: "사내 문서를 기반으로 먼저 검색 후 정보를 처리하는 RAG(검색 증강 생성) 아키텍처를 도입하여 환각 현상을 배제합니다.",
    citationDocId: "cl_doc_1",
    citationText: "RAG(Retrieval-Augmented Generation, 검색 증강 생성) 아키텍처를 기반으로 설계되었습니다. 이는 사용자의 질문을 기반으로 사내의 축적된 규정 및 매뉴얼 데이터를 먼저 검색한 뒤, 검색된 지식을 컨텍스트로 LLM에 주입하여 거짓 답변(Hallucination) 현상을 완전히 배제합니다.",
  },
  {
    id: "q_cl_2",
    solution: "clarinet",
    type: "tf",
    difficulty: "easy",
    question: "클라리넷(CLARINET)은 고성능 유사도 검색을 구현하기 위해 사내 매뉴얼이나 비정형 문서를 토크나이징하고 임베딩 벡터로 변환하여 벡터 DB에 인덱싱한다.",
    options: ["O", "X"],
    answer: "O",
    explanation: "클라리넷은 문서 임베딩 가속 및 유사도 매칭을 극대화하기 위해 벡터 DB(Vector Database) 기술을 사용합니다.",
    citationDocId: "cl_doc_1",
    citationText: "대규모 비정형 문서를 토큰화한 뒤, Milvus 또는 pgvector 같은 고성능 벡터 데이터베이스(Vector DB)에 고차원 임베딩 벡터로 정렬 및 인덱싱을 수행합니다.",
  },
];

// ── 3. AI 오디오 브리핑 대본 설정 (Podcast Dialogue Script) ──
const PODCAST_SCRIPT = [
  {
    speaker: "이지원",
    gender: "female",
    text: "안녕하세요! 오케스트로 아카데미가 전해드리는 AI 오디오 브리핑, 딥 다이브 시간입니다. 진행을 맡은 이지원입니다.",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "반갑습니다, 김민우입니다. 오늘은 오케스트로가 자랑하는 최고의 가상화 및 클라우드 솔루션 3대장, 즉 콘트라베이스, 비올라, 심포니 A.I.에 대해 자세히 풀어보려고 합니다.",
  },
  {
    speaker: "이지원",
    gender: "female",
    text: "아주 흥미진진하겠군요! 민우 씨, 요즘 가상화 시장에서는 VMware의 라이선스 인상 때문에 다들 가슴을 졸이고 있잖아요. 그래서 '콘트라베이스'가 아주 뜨거운 화두라고 들었습니다.",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "그렇습니다. 콘트라베이스는 VMware vSphere를 일대일로 완전 대체할 수 있는 강력한 서버 가상화 IaaS 솔루션입니다. 오픈스택과 KVM 하이퍼바이저를 깊이 있게 튜닝하여 공공과 대기업 금융권에서 널리 안정적으로 사용되고 있습니다.",
  },
  {
    speaker: "이지원",
    gender: "female",
    text: "오, KVM과 오픈스택 기반이군요! 그렇다면 기존 VMware 가상 머신들을 콘트라베이스로 옮길 때 문제나 다운타임이 크지 않을까요?",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "그 우려를 완벽하게 해소해 주는 도구가 바로 내장된 V2C, 즉 VMware to Contrabass 자동 마이그레이션 모듈입니다. VMDK 파일을 QCOW2 이미지로 실시간 포맷 변환해주고 가상 스위치 포트 정보까지 Neutron으로 자동 매핑하여 다운타임을 획기적으로 단축해 주죠.",
  },
  {
    speaker: "이지원",
    gender: "female",
    text: "와우, V2C 변환 툴이 정말 유용하겠군요! 시험 문제에서도 아주 자주 출제될 만한 킬러 포인트네요. 그렇다면 다음으로 '비올라'에 대해서도 알아보고 싶습니다. 컨테이너 기술인 쿠버네티스를 제어한다고 들었어요.",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "네, 맞습니다. 비올라는 쿠버네티스 멀티 클러스터를 관리하는 엔터프라이즈 PaaS 플랫폼입니다. Istio 서비스 메쉬를 이용해 컨테이너 트래픽의 모니터링 토폴로지를 시각화하고, 보안을 위한 RBAC 즉, 역할 기반 접근 제어와 네임스페이스 격리를 제공하죠. 스케일링 측면에서는 부하 발생 시 포드를 신속히 조절하는 HPA 정책도 중요합니다.",
  },
  {
    speaker: "이지원",
    gender: "female",
    text: "Istio 서비스 메쉬와 RBAC 권한 모델, 그리고 자동 확장을 돕는 HPA까지! 컨테이너 인프라 관리의 종합 선물세트 같습니다. 그럼 지능형 AI 제어센터로 불리는 '심포니 A.I.'는 어떤 역할을 담당하나요?",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "심포니 A.I.는 오케스트로의 핵심 AIOps 기술의 정수입니다. 성능 시계열 데이터를 분석하는 LSTM 신경망 모델을 활용하여 성능 임계점 이전에 예지 경보를 내리는 이상 징후 감지 기능을 가지고 있으며, 장애 근본 원인을 분석하는 RCA, 리소스를 최적 크기로 맞춰 비용을 절감해 주는 라이트사이징 분석 기능까지 지원합니다.",
  },
  {
    speaker: "이지원",
    gender: "female",
    text: "자원 최적화를 통한 실시간 모니터링과 비용 절감까지 한눈에 해결해 주는군요. 오늘 콘트라베이스의 V2C, 비올라의 RBAC 및 HPA, 심포니 A.I.의 LSTM 및 라이트사이징까지 전 분야의 핵심 키워드를 총망라해 보았습니다. 수험생 여러분의 고득점을 응원하며 오디오 브리핑을 마칩니다. 민우 씨 고생하셨습니다.",
  },
  {
    speaker: "김민우",
    gender: "male",
    text: "네, 고생 많으셨습니다. 수험생 여러분, 문제은행의 출제 범위와 가이드 문서를 꼼꼼히 확인하셔서 모두 고득점 합격하시기를 진심으로 기원합니다. 파이팅입니다!",
  },
];

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState("chat"); // chat, gen, exam, podcast, bank
  const [selectedSolution, setSelectedSolution] = useState("contrabass"); // contrabass, viola, symphony, clarinet
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState("cb_doc_1");
  const [highlightText, setHighlightText] = useState("");

  // AI Chat 상태
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "안녕하세요! 오케스트로 아카데미 노트북LM 지능형 어시스턴트입니다. 업로드된 솔루션 문서를 바탕으로 무엇이든 답변해 드립니다. 아래 추천 질문이나 원하시는 질문을 입력하세요.",
      citations: [],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);

  // 문제 자동 출제 설정 상태
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState("medium"); // easy, medium, hard
  const [genType, setGenType] = useState("all"); // all, choice, tf, short, essay
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStepText, setGenStepText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // 모의고사 상태
  const [examStarted, setExamStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentExamIdx, setCurrentExamIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState({}); // { qId: answerVal }
  const [examTimer, setExamTimer] = useState(600); // 10분 (600초)
  const [examFinished, setExamFinished] = useState(false);
  const [examResult, setExamResult] = useState(null); // { score, total, corrects, Wrongs }
  const timerRef = useRef(null);

  // 오디오 브리핑 상태
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentPodcastIdx, setCurrentPodcastIdx] = useState(-1);
  const [podcastSpeed, setPodcastSpeed] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const utterRef = useRef(null);

  // 문제 보관함 상태
  const [questionBank, setQuestionBank] = useState([...PREDEFINED_QUESTIONS]);
  const [bankFilterSol, setBankFilterSol] = useState("all");
  const [bankFilterType, setBankFilterType] = useState("all");
  const [bankFilterDiff, setBankFilterDiff] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 문제 상세 모달 상태
  const [questionModal, setQuestionModal] = useState(null); // { mode: 'add'|'edit', data }

  // 새 소스 추가 상태
  const [addSourceModal, setAddSourceModal] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState("");
  const [newSourceContent, setNewSourceContent] = useState("");

  // DOM Refs
  const chatEndRef = useRef(null);
  const docViewerRef = useRef(null);
  const transcriptRefs = useRef([]);

  // TTS 음성 리스트 로드
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const list = window.speechSynthesis.getVoices();
        const koList = list.filter((v) => v.lang.includes("ko") || v.lang.includes("KR"));
        setVoices(koList);
      }
    };
    if (typeof window !== "undefined" && window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 대화 끝 스크롤 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatTyping]);

  // 타이머 작동 (모의고사)
  useEffect(() => {
    if (examStarted && examTimer > 0 && !examFinished) {
      timerRef.current = setInterval(() => {
        setExamTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examStarted, examFinished, examTimer]);

  // 오디오 브리핑 스크롤 포커스
  useEffect(() => {
    if (currentPodcastIdx >= 0 && transcriptRefs.current[currentPodcastIdx]) {
      transcriptRefs.current[currentPodcastIdx].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentPodcastIdx]);

  // ── 출처 문구 하이라이트 함수 ──
  const triggerCitation = (docId, textSegment) => {
    setSelectedDocId(docId);
    setHighlightText(textSegment);
    // UI에 출처 하이라이팅 유도
    setTimeout(() => {
      const container = docViewerRef.current;
      if (container) {
        const textNodes = container.querySelectorAll(".doc-paragraph");
        textNodes.forEach((node) => {
          if (node.textContent.includes(textSegment.slice(0, 15))) {
            node.scrollIntoView({ behavior: "smooth", block: "center" });
            node.style.background = "rgba(245, 158, 11, 0.4)";
            node.style.transition = "background 0.5s ease";
            setTimeout(() => {
              node.style.background = "rgba(245, 158, 11, 0.15)";
            }, 3000);
          }
        });
      }
    }, 100);
  };

  // ── AI 챗봇 질문 답변 시뮬레이터 ──
  const handleSendChat = (text) => {
    const messageText = text || chatInput;
    if (!messageText.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: messageText, citations: [] }]);
    setChatInput("");
    setIsChatTyping(true);

    setTimeout(() => {
      let responseText = "";
      let citations = [];

      const query = messageText.toLowerCase();

      // 키워드 기반 하이브리드 지능형 매칭
      if (query.includes("콘트라베이스") || query.includes("contrabass")) {
        if (query.includes("이관") || query.includes("마이그레이션") || query.includes("v2c")) {
          responseText = "콘트라베이스는 VMware 가상 환경을 가동 중인 가상 머신(VM) 상태로 포맷을 일괄 변경해 주는 'V2C(VMware to Contrabass)' 마이그레이션 툴을 탑재하고 있습니다. 이를 활용하여 기존 VMDK 디스크 이미지를 QCOW2 포맷으로 라이브 변환하고 다운타임을 최소화할 수 있습니다.";
          citations.push({
            docId: "cb_doc_2",
            docTitle: "CONTRABASS 설치 및 마이그레이션 가이드",
            text: "V2C(VMware to Contrabass) 변환 도구를 기본 내장하고 있습니다. V2C 도구는 VMware의 VMDK 디스크 이미지를 콘트라베이스 표준 이미지 포맷인 QCOW2 포맷으로 라이브 변환하고",
          });
        } else if (query.includes("네트워크") || query.includes("ovs") || query.includes("스위치")) {
          responseText = "콘트라베이스는 SDN 가상화를 표준 지원하기 위해 가상화 표준 스위치인 Open vSwitch(OVS)를 탑재하고 있습니다. 이를 통해 가상 머신 간 격리 상태를 만들고 VXLAN 오버레이 대역으로 네트워크 패킷 통신을 안정적으로 보장해 줍니다.";
          citations.push({
            docId: "cb_doc_1",
            docTitle: "CONTRABASS 아키텍처 개요",
            text: "가상 스위치 제어를 위해 가상화 환경 표준인 Open vSwitch(OVS)를 기본 탑재하고 있어 가상 머신 간 트래픽 격리 및 VXLAN 기반 오버레이 네트워크 통신을 완벽하게 보장합니다.",
          });
        } else {
          responseText = "콘트라베이스(CONTRABASS)는 오픈스택 및 KVM 하이퍼바이저 가상화 아키텍처를 기반으로 설계된 IaaS 가상화 플랫폼입니다. 컨트롤러, 컴퓨트, 가상 스토리지 노드로 나뉘어 설계되어 우수한 고가용성(HA)을 가지며 Pacemaker와 Corosync 엔진을 탑재하고 있습니다.";
          citations.push({
            docId: "cb_doc_1",
            docTitle: "CONTRABASS 아키텍처 개요",
            text: "콘트라베이스(CONTRABASS)는 오케스트로의 핵심적인 서버 가상화 플랫폼(IaaS) 솔루션입니다. 오픈스택(OpenStack) 오픈소스 커뮤니티 엔진을 기반으로 설계되었으며, 안정적인 KVM 하이퍼바이저 가상화 기술을 제공하여",
          });
        }
      } else if (query.includes("비올라") || query.includes("viola")) {
        if (query.includes("보안") || query.includes("rbac") || query.includes("권한")) {
          responseText = "비올라 PaaS 플랫폼은 쿠버네티스 컨테이너 상의 트래픽을 세밀히 제어하고 격리하기 위해 쿠버네티스 RBAC(역할 기반 권한 제어)를 선언하여 사용자 계정별 권한 범위를 명확히 안전하게 통제합니다.";
          citations.push({
            docId: "vl_doc_1",
            docTitle: "VIOLA 컨테이너 플랫폼 운영 가이드",
            text: "네임스페이스 수준의 격리 및 쿠버네티스 RBAC(역할 기반 접근 제어) 모델을 기본 제공하여, 개발자 및 운영자의 권한 범위를 명확히 제한합니다.",
          });
        } else if (query.includes("서비스 메쉬") || query.includes("istio")) {
          responseText = "비올라는 Istio 서비스 메쉬(Service Mesh)를 컨테이너 상에 통합하여 가시성을 확보합니다. 클러스터 내 마이크로서비스 간 트래픽 경로와 흐름을 시각적 토폴로지 맵을 통해 실시간으로 관찰하고 파악할 수 있도록 도울 수 있습니다.";
          citations.push({
            docId: "vl_doc_1",
            docTitle: "VIOLA 컨테이너 플랫폼 운영 가이드",
            text: "Istio 서비스 메쉬(Service Mesh)를 네이티브하게 결합하고 있습니다. 이를 통해 컨테이너 간 모든 게이트웨이 및 암호화 통신을 실시간 토폴로지 맵으로 모니터링할 수 있습니다.",
          });
        } else {
          responseText = "비올라(VIOLA)는 쿠버네티스 오픈소스 엔진을 내부 코어로 커스텀하여 개발된 멀티 쿠버네티스 클러스터 오케스트레이션 플랫폼(PaaS)입니다. Istio 서비스 메쉬, Prometheus 모니터링 및 HPA 자동화 조율 기능 등을 하나로 모아 제공합니다.";
          citations.push({
            docId: "vl_doc_1",
            docTitle: "VIOLA 컨테이너 플랫폼 운영 가이드",
            text: "비올라(VIOLA)는 쿠버네티스(Kubernetes) 엔진을 코어로 채택한 오케스트로의 클라우드 네이티브 PaaS 컨테이너 관리 플랫폼입니다.",
          });
        }
      } else if (query.includes("심포니") || query.includes("symphony")) {
        if (query.includes("이상") || query.includes("lstm") || query.includes("예측")) {
          responseText = "심포니 A.I.는 하이브리드 서버들로부터 자원 계측치를 상시 적재하며, 시계열 성능 지표 연산용 LSTM 및 Autoencoder 딥러닝 인공신경망으로 리소스 오버랩을 예측해 정상 범위를 벗어난 이상 패턴을 사전 감지합니다.";
          citations.push({
            docId: "sp_doc_1",
            docTitle: "SYMPHONY A.I. 운영 분석 및 최적화 매뉴얼",
            text: "딥러닝 기반 LSTM(Long Short-Term Memory) 알고리즘 및 오토인코더(Autoencoder) 인공신경망을 활용해 성능 임계치를 동적으로 예측합니다.",
          });
        } else if (query.includes("비용") || query.includes("라이트") || query.includes("사이징")) {
          responseText = "심포니 A.I.는 비용 최적화를 지원하기 위해 오버프로비저닝(Over-provisioning)을 찾아내고, CPU나 메모리 크기를 리스케일링하여 최적의 사양을 계산 및 제안하는 '라이트사이징(Right-sizing)' 알고리즘을 수행하여 기업 비용을 감축해 줍니다.";
          citations.push({
            docId: "sp_doc_1",
            docTitle: "SYMPHONY A.I. 운영 분석 및 최적화 매뉴얼",
            text: "과다 할당된 자원을 축소하는 라이트사이징(Right-sizing) 크기 조정 추천 알고리즘을 실행하여 CPU/메모리 오버헤드를 줄이고 예산을 절감할 수 있는",
          });
        } else {
          responseText = "심포니 A.I.(SYMPHONY A.I.)는 다차원 로그 및 서버 수치 정보를 딥러닝 예측망으로 결합 연산하여 클라우드 장애를 조기 차단하고 가동 상태를 유지 관리하는 AIOps 지능형 플랫폼입니다.";
          citations.push({
            docId: "sp_doc_1",
            docTitle: "SYMPHONY A.I. 운영 분석 및 최적화 매뉴얼",
            text: "대규모 하이브리드 클라우드 자원의 최적화 및 지능형 운영 관리를 수행하는 오케스트로의 AIOps 솔루션입니다.",
          });
        }
      } else if (query.includes("클라리넷") || query.includes("clarinet") || query.includes("생성형")) {
        responseText = "클라리넷(CLARINET)은 RAG(검색 증강 생성) 파이프라인과 내부 LLM 사설 인프라 구성을 지원해 거짓 답변을 원천 배제합니다. 비정형 규정 문서를 처리하기 위해 임베딩 벡터값들을 Milvus 및 pgvector 등 고성능 벡터 데이터베이스에 색인하여 유사도 비교 속도를 향상시킵니다.";
        citations.push({
          docId: "cl_doc_1",
          docTitle: "CLARINET 생성형 AI 비즈니스 서비스 안내",
          text: "RAG(Retrieval-Augmented Generation, 검색 증강 생성) 아키텍처를 기반으로 설계되었습니다. 이는 사용자의 질문을 기반으로 사내의 축적된 규정 및 매뉴얼 데이터를 먼저 검색한 뒤,",
        });
      } else {
        responseText = "해당 질문에 대한 정확한 정보가 업로드된 오케스트로 솔루션 지식베이스에 존재하지 않습니다. 콘트라베이스의 V2C 기술, 비올라의 쿠버네티스 접근 제어(RBAC), 심포니 AI의 이상 징후 감지 및 라이트사이징, 혹은 클라리넷의 RAG 벡터 DB 기반에 관해 질문해보세요.";
      }

      setIsChatTyping(false);
      setChatMessages((prev) => [...prev, { sender: "ai", text: responseText, citations }]);
    }, 1200);
  };

  // ── AI 문제 자동 출제 로직 ──
  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setGenProgress(10);
    setGenStepText("지식 베이스 문서 파일 색인 중...");

    const stepIntervals = [
      { prg: 30, text: `${selectedSolution.toUpperCase()} 관련 핵심 메트릭 파싱 중...` },
      { prg: 60, text: "문맥 분석 및 난이도별 기출 문장 추출 중..." },
      { prg: 85, text: "객관식 오답 보기 구성 및 출처 연결 코드 생성 중..." },
      { prg: 100, text: "노트북LM 문제 자동 출제 완료!" },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < stepIntervals.length) {
        setGenProgress(stepIntervals[currentStep].prg);
        setGenStepText(stepIntervals[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          // 출제 필터링 수행
          const filtered = questionBank.filter((q) => {
            const solMatch = q.solution === selectedSolution;
            const diffMatch = genDifficulty === "all" || q.difficulty === genDifficulty;
            const typeMatch = genType === "all" || q.type === genType;
            return solMatch && diffMatch && typeMatch;
          });

          // 필터링 결과가 적을 시 풀에서 해당 솔루션 문제 임의로 복사해서 채움
          let finalSet = [...filtered];
          if (finalSet.length === 0) {
            finalSet = questionBank.filter((q) => q.solution === selectedSolution);
          }

          // 요청한 출제 수 만큼 자르기
          finalSet = finalSet.sort(() => 0.5 - Math.random()).slice(0, genCount);

          setGeneratedQuestions(finalSet);
          setIsGenerating(false);
          setGenProgress(0);
          setGenStepText("");
        }, 500);
      }
    }, 800);
  };

  // ── 모의고사 시작 ──
  const startExam = () => {
    if (generatedQuestions.length === 0) {
      alert("출제된 문제가 없습니다. 먼저 'AI 문제 출제'를 진행해 주세요.");
      return;
    }
    setExamQuestions([...generatedQuestions]);
    setCurrentExamIdx(0);
    setExamAnswers({});
    setExamTimer(600);
    setExamFinished(false);
    setExamResult(null);
    setExamStarted(true);
  };

  // ── 모의고사 답안 입력 ──
  const handleExamAnswer = (val) => {
    const q = examQuestions[currentExamIdx];
    setExamAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  // ── 모의고사 채점 및 종료 ──
  function finishExam() {
    clearInterval(timerRef.current);
    let corrects = 0;
    let wrongs = 0;
    const details = [];

    examQuestions.forEach((q) => {
      const userAns = (examAnswers[q.id] || "").toString().trim().toLowerCase();
      const dbAns = q.answer.toString().trim().toLowerCase();
      const isCorrect = userAns === dbAns;

      if (isCorrect) corrects++;
      else wrongs++;

      details.push({
        id: q.id,
        question: q.question,
        userAns: examAnswers[q.id] || "미입력",
        dbAns: q.answer,
        isCorrect,
        explanation: q.explanation,
        citationDocId: q.citationDocId,
        citationText: q.citationText,
      });
    });

    const score = Math.round((corrects / examQuestions.length) * 100);

    setExamResult({
      score,
      total: examQuestions.length,
      corrects,
      wrongs,
      details,
    });
    setExamFinished(true);
  }

  // ── AI 오디오 브리핑 플레이어 음성 제어 ──
  const playPodcast = () => {
    if (isPlayingPodcast) {
      window.speechSynthesis.pause();
      setIsPlayingPodcast(false);
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlayingPodcast(true);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingPodcast(true);
    speakLine(0);
  };

  const speakLine = (idx) => {
    if (idx >= PODCAST_SCRIPT.length) {
      setIsPlayingPodcast(false);
      setCurrentPodcastIdx(-1);
      return;
    }

    setCurrentPodcastIdx(idx);
    const line = PODCAST_SCRIPT[idx];
    const utter = new SpeechSynthesisUtterance(line.text);
    utterRef.current = utter;

    // 한국어 음성 지정
    const koVoice = voices.find((v) => v.lang.includes("ko") || v.lang.includes("KR"));
    if (koVoice) utter.voice = koVoice;

    // Ji-won과 Min-woo 목소리 개별 속성 튜닝 (1인 다역 및 입체적 효과)
    if (line.speaker === "이지원") {
      utter.pitch = 1.15; // 높은 톤
      utter.rate = 1.05 * podcastSpeed;
    } else {
      utter.pitch = 0.9; // 낮은 톤
      utter.rate = 0.98 * podcastSpeed;
    }

    utter.onend = () => {
      speakLine(idx + 1);
    };

    utter.onerror = () => {
      setIsPlayingPodcast(false);
      setCurrentPodcastIdx(-1);
    };

    window.speechSynthesis.speak(utter);
  };

  const stopPodcast = () => {
    window.speechSynthesis.cancel();
    setIsPlayingPodcast(false);
    setCurrentPodcastIdx(-1);
  };

  // ── 문제 보관함 Excel 파일 내보내기 ──
  const exportToExcel = () => {
    // 엑셀 내보내기용 필터링
    const data = filteredBankQuestions.map((q, idx) => ({
      번호: idx + 1,
      솔루션: q.solution.toUpperCase(),
      문제유형:
        q.type === "choice"
          ? "객관식"
          : q.type === "tf"
          ? "O/X"
          : q.type === "short"
          ? "단답형"
          : "서술형",
      난이도: q.difficulty === "easy" ? "초급" : q.difficulty === "medium" ? "중급" : "고급",
      문제내용: q.question,
      보기: q.options ? q.options.join(" / ") : "",
      정답: q.answer,
      해설: q.explanation,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "오케스트로 문제은행");

    // 컬럼 너비 오토피팅 조절
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 45 },
      { wch: 25 },
      { wch: 15 },
      { wch: 50 },
    ];

    XLSX.writeFile(workbook, `Okestro_Question_Bank_${selectedSolution.toUpperCase()}.xlsx`);
  };

  // ── 수동 문제 추가/수정 저장 ──
  const saveCustomQuestion = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = fd.get("type");
    const optString = fd.get("options");
    const options =
      type === "choice"
        ? optString.split(",").map((s) => s.trim())
        : type === "tf"
        ? ["O", "X"]
        : null;

    const newQ = {
      id: questionModal.data?.id || `custom_q_${Date.now()}`,
      solution: fd.get("solution"),
      type,
      difficulty: fd.get("difficulty"),
      question: fd.get("question"),
      options,
      answer: fd.get("answer"),
      explanation: fd.get("explanation"),
      citationDocId: fd.get("citationDocId") || null,
      citationText: fd.get("citationText") || "",
    };

    if (questionModal.mode === "add") {
      setQuestionBank((prev) => [newQ, ...prev]);
    } else {
      setQuestionBank((prev) => prev.map((q) => (q.id === newQ.id ? newQ : q)));
    }
    setQuestionModal(null);
  };

  // 문제 삭제
  const deleteQuestion = (id) => {
    if (confirm("정말 이 문제를 삭제하시겠습니까?")) {
      setQuestionBank((prev) => prev.filter((q) => q.id !== id));
    }
  };

  // ── 새 소스 문서 등록 ──
  const addNewSource = (e) => {
    e.preventDefault();
    if (!newSourceTitle.trim() || !newSourceContent.trim()) {
      alert("문서 제목과 내용을 모두 입력해 주세요.");
      return;
    }
    const newDoc = {
      id: `custom_doc_${Date.now()}`,
      title: newSourceTitle,
      content: newSourceContent,
    };
    setDocuments((prev) => ({
      ...prev,
      [selectedSolution]: [...(prev[selectedSolution] || []), newDoc],
    }));
    setSelectedDocId(newDoc.id);
    setNewSourceTitle("");
    setNewSourceContent("");
    setAddSourceModal(false);
  };

  // ── 필터링 및 통계 바인딩 ──
  const filteredBankQuestions = questionBank.filter((q) => {
    const solMatch = bankFilterSol === "all" || q.solution === bankFilterSol;
    const typeMatch = bankFilterType === "all" || q.type === bankFilterType;
    const diffMatch = bankFilterDiff === "all" || q.difficulty === bankFilterDiff;
    const searchMatch =
      !searchQuery ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return solMatch && typeMatch && diffMatch && searchMatch;
  });

  // 통계 계산
  const totalBankCount = questionBank.length;
  const cbCount = questionBank.filter((q) => q.solution === "contrabass").length;
  const vlCount = questionBank.filter((q) => q.solution === "viola").length;
  const spCount = questionBank.filter((q) => q.solution === "symphony").length;
  const clCount = questionBank.filter((q) => q.solution === "clarinet").length;

  const choiceCount = questionBank.filter((q) => q.type === "choice").length;
  const tfCount = questionBank.filter((q) => q.type === "tf").length;
  const shortCount = questionBank.filter((q) => q.type === "short").length;
  const essayCount = questionBank.filter((q) => q.type === "essay").length;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: C.bg,
        color: C.text,
        display: "flex",
        fontFamily: "inherit",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <style>{`
        /* 플랫 디자인 2.0 카드 오버라이드 */
        div[style*="borderRadius"]:not([style*="50%"]), div[style*="border-radius"]:not([style*="50%"]) {
          border-radius: 12px !important;
        }
        div[style*="boxShadow"]:not([style*="none"]), div[style*="box-shadow"]:not([style*="none"]) {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
        }
        
        /* 테이블 플랫 2.0 */
        table {
          border-collapse: collapse !important;
          border: 1px solid #e2e8f0 !important;
        }
        th {
          background: #f8fafc !important;
          color: #475569 !important;
          border: 1px solid #e2e8f0 !important;
          font-weight: 700 !important;
        }
        td {
          border: 1px solid #e2e8f0 !important;
          color: #334155 !important;
          background: #ffffff !important;
          font-weight: 500 !important;
        }
        
        /* 버튼 및 뱃지 */
        button, .anim-btn {
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          border-radius: 8px !important;
          background: #ffffff;
          color: #334155;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        button:hover, .anim-btn:hover {
          transform: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        button:active, .anim-btn:active {
          transform: scale(0.98) !important;
          background: #f1f5f9 !important;
        }
        
        /* 입력 필드 */
        input[type="text"], input[type="password"], input[type="email"], select, textarea {
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
          background: #ffffff !important;
          color: #0f172a !important;
        }
      `}</style>
      {/* ── 사이드바: 솔루션 문서 목록 ── */}
      <div
        style={{
          width: "290px",
          background: "rgba(15, 23, 42, 0.75)",
          borderRight: `1px solid ${C.border}`,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxSizing: "border-box",
        }}
      >
        <div>
          <h3 style={{ fontSize: "14px", color: C.purpleLight, margin: "0 0 10px 0", fontWeight: 800 }}>
            오케스트로 솔루션 선택
          </h3>
          <select
            value={selectedSolution}
            onChange={(e) => {
              setSelectedSolution(e.target.value);
              const docsList = documents[e.target.value] || [];
              if (docsList.length > 0) setSelectedDocId(docsList[0].id);
            }}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background: C.surfaceCard,
              border: `1px solid ${C.border}`,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="contrabass">CONTRABASS (IaaS 가상화)</option>
            <option value="viola">VIOLA (PaaS 컨테이너)</option>
            <option value="symphony">SYMPHONY A.I. (AIOps/CMP)</option>
            <option value="clarinet">CLARINET (생성형 AIaaS)</option>
          </select>
        </div>

        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: "12px", color: C.muted, margin: 0, fontWeight: 700 }}>
              학습 소스 문서 ({documents[selectedSolution]?.length || 0})
            </h4>
            <button
              onClick={() => setAddSourceModal(true)}
              style={{
                background: "transparent",
                border: "none",
                color: C.purpleLight,
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              + 문서 추가
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", maxHeight: "300px" }}>
            {(documents[selectedSolution] || []).map((doc) => {
              const isActive = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: isActive ? "rgba(139, 92, 246, 0.15)" : C.surfaceCard,
                    border: `1px solid ${isActive ? C.purple : C.border}`,
                    color: isActive ? "#fff" : C.subtle,
                    fontSize: "12px",
                    fontWeight: isActive ? 800 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>📄</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 네비게이션 버튼들 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: `1px solid ${C.border}`, paddingTop: "20px" }}>
          {[
            { id: "chat", label: "💬 AI 문서 챗봇", desc: "소스 문서 내용 기반 Q&A" },
            { id: "gen", label: "⚙️ AI 문제 자동 출제", desc: "유형별/난이도별 문제 빌드" },
            { id: "exam", label: "📝 실전 모의고사", desc: "타이머 연동 점수 진단" },
            { id: "podcast", label: "🎙️ AI 오디오 브리핑", desc: "2인 호스트 지식 팟캐스트" },
            { id: "bank", label: "📂 문제은행 보관함", desc: "문제 관리 및 Excel 출력" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "exam") setExamStarted(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: active ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : C.surface,
                  border: `1px solid ${active ? C.purpleLight : C.border}`,
                  color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  boxShadow: active ? "0 4px 12px rgba(139, 92, 246, 0.3)" : "none",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 800 }}>{tab.label}</div>
                <div style={{ fontSize: "10px", color: active ? "rgba(255,255,255,0.8)" : C.muted, marginTop: "2px" }}>
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 메인 컨텐츠 영역 (노트북 허브) ── */}
      <div
        style={{
          flexGrow: 1,
          padding: "24px",
          display: "grid",
          gridTemplateColumns: activeTab === "bank" ? "1fr" : "3fr 2fr",
          gap: "20px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            background: C.surface,
            borderRadius: "16px",
            border: `1px solid ${C.border}`,
            padding: "24px",
            boxShadow,
            display: "flex",
            flexDirection: "column",
            minHeight: "600px",
          }}
        >
          {/* ── 탭 1: AI 문서 챗봇 ── */}
          {activeTab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", margin: 0, fontWeight: 800 }}>
                  AI 소스 분석 챗봇
                </h2>
                <p style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                  등록된 솔루션 문서를 실시간 분석하여 답변합니다. 답변에 명시된 출처를 누르면 해당 본문을 강조해 드립니다.
                </p>
              </div>

              {/* 채팅창 로그 */}
              <div
                style={{
                  flexGrow: 1,
                  maxHeight: "380px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  paddingRight: "8px",
                  marginBottom: "16px",
                }}
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      background: msg.sender === "user" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : C.surfaceCard,
                      border: `1px solid ${msg.sender === "user" ? C.blue : C.border}`,
                      borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      padding: "12px 16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: C.muted, marginBottom: "4px", fontWeight: 700 }}>
                      {msg.sender === "user" ? "사용자" : "노트북LM AI"}
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: "1.5", color: "#fff" }}>{msg.text}</div>

                    {msg.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "6px",
                          borderTop: `1px solid rgba(255,255,255,0.06)`,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {msg.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            onClick={() => triggerCitation(cite.docId, cite.text)}
                            style={{
                              background: "rgba(139, 92, 246, 0.2)",
                              border: `1px solid ${C.purple}`,
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "10px",
                              color: C.purpleLight,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            🔗 출처: {cite.docTitle}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isChatTyping && (
                  <div style={{ alignSelf: "flex-start", color: C.muted, fontSize: "12px", display: "flex", gap: "4px" }}>
                    <span>AI가 최적 답변 탐색 중</span>
                    <span className="dot-flow">...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 추천 질문 키워드 */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {[
                  selectedSolution === "contrabass" && "V2C 마이그레이션 방법이 뭐야?",
                  selectedSolution === "contrabass" && "네트워크 가상 스위치는 뭘 써?",
                  selectedSolution === "viola" && "비올라의 보안 RBAC은 어떻게 동작해?",
                  selectedSolution === "viola" && "Istio 서비스 메쉬 장점이 뭐야?",
                  selectedSolution === "symphony" && "이상 감지 모델이 뭐야?",
                  selectedSolution === "symphony" && "라이트사이징은 무엇을 최적화해?",
                  selectedSolution === "clarinet" && "RAG 아키텍처 구조를 알려줘.",
                ]
                  .filter(Boolean)
                  .map((qText, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(qText)}
                      style={{
                        background: C.surfaceCard,
                        border: `1px solid ${C.border}`,
                        borderRadius: "20px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        color: C.subtle,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.purple)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                    >
                      {qText}
                    </button>
                  ))}
              </div>

              {/* 입력 패널 */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder={`${selectedSolution.toUpperCase()} 지식 문서에 관해 질문을 입력해 주세요...`}
                  style={{
                    flexGrow: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    outline: "none",
                    fontSize: "13px",
                  }}
                />
                <button
                  onClick={() => handleSendChat()}
                  style={{
                    background: `linear-gradient(135deg, ${C.blueMid}, ${C.indigo})`,
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 20px",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  전송
                </button>
              </div>
            </div>
          )}

          {/* ── 탭 2: AI 문제 자동 출제 ── */}
          {activeTab === "gen" && (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", margin: 0, fontWeight: 800 }}>
                  AI 문제 자동 출제기
                </h2>
                <p style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                  현재 학습 소스로 지정된 문서를 기반으로 시험 문제를 실시간 자동 조합 및 출제합니다.
                </p>
              </div>

              {/* 생성 설정 패널 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "14px",
                  background: C.surfaceCard,
                  padding: "16px",
                  borderRadius: "12px",
                  border: `1px solid ${C.border}`,
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label style={{ fontSize: "11px", color: C.muted, fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    출제 문항 수
                  </label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    <option value="3">3 문제</option>
                    <option value="5">5 문제</option>
                    <option value="10">10 문제</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: C.muted, fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    난이도 조절
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    <option value="all">전체 난이도 혼합</option>
                    <option value="easy">초급 (이론 위주)</option>
                    <option value="medium">중급 (운영/명령어)</option>
                    <option value="hard">고급 (아키텍처/RCA)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: C.muted, fontWeight: 700, display: "block", marginBottom: "6px" }}>
                    문제 유형
                  </label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    <option value="all">전체 유형 혼합</option>
                    <option value="choice">객관식 (4지선다)</option>
                    <option value="tf">O/X 진위형</option>
                    <option value="short">주관식 단답형</option>
                    <option value="essay">기술 서술형</option>
                  </select>
                </div>
              </div>

              {/* 출제 액션 버튼 */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    border: "none",
                    borderRadius: "30px",
                    padding: "14px 40px",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  {isGenerating ? "AI 문제 분석 및 출제 중..." : `✨ ${selectedSolution.toUpperCase()} AI 문제 출제`}
                </button>
              </div>

              {/* AI 빌드 애니메이션 */}
              {isGenerating && (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    background: C.surfaceCard,
                    borderRadius: "12px",
                    border: `1px solid ${C.purple}`,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      height: "6px",
                      borderRadius: "3px",
                      overflow: "hidden",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: `${genProgress}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.purpleLight }}>{genStepText}</div>
                </div>
              )}

              {/* 생성된 문제 리스트 */}
              {!isGenerating && generatedQuestions.length > 0 && (
                <div style={{ flexGrow: 1, overflowY: "auto", maxHeight: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: C.purpleLight }}>
                      출제 결과: 총 {generatedQuestions.length}문항 빌드 완료
                    </span>
                    <button
                      onClick={startExam}
                      style={{
                        background: C.green,
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      📝 이 문항으로 모의고사 시작
                    </button>
                  </div>

                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      style={{
                        background: C.surfaceCard,
                        padding: "16px",
                        borderRadius: "10px",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", background: C.purple, padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                          Q {idx + 1}
                        </span>
                        <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px", color: C.muted, fontWeight: 700 }}>
                          {q.type === "choice" ? "객관식" : q.type === "tf" ? "O/X" : q.type === "short" ? "단답형" : "서술형"}
                        </span>
                        <span style={{ fontSize: "10px", color: q.difficulty === "hard" ? C.red : q.difficulty === "medium" ? C.amber : C.green, fontWeight: 800 }}>
                          {q.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, lineHeight: 1.4, color: "#fff", marginBottom: "12px" }}>
                        {q.question}
                      </div>

                      {/* 객관식 보기 렌더링 */}
                      {q.options && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              style={{
                                padding: "8px 12px",
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: "6px",
                                fontSize: "12px",
                                color: C.subtle,
                              }}
                            >
                              {oIdx + 1}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isGenerating && generatedQuestions.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "13px" }}>
                  출제 조건 조절 후 상단 [AI 문제 출제] 버튼을 클릭해 주세요.
                </div>
              )}
            </div>
          )}

          {/* ── 탭 3: 모의고사 모드 ── */}
          {activeTab === "exam" && (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", margin: 0, fontWeight: 800 }}>
                  실전 모의고사 진단
                </h2>
                <p style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                  타이머 시간 내에 전체 출제된 문제를 정식 기재하여 제출하면 맞춤 합격 지수를 계산합니다.
                </p>
              </div>

              {!examStarted && !examFinished && (
                <div style={{ textAlign: "center", padding: "60px", background: C.surfaceCard, borderRadius: "12px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>📝</div>
                  <h3 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontWeight: 800 }}>
                    모의고사 응시 준비 완료
                  </h3>
                  <p style={{ fontSize: "12px", color: C.subtle, marginBottom: "20px", lineHeight: 1.5 }}>
                    출제 조건에 설정되었던 {generatedQuestions.length}개의 문제를 10분 내에 해결해야 합니다.<br />
                    답안 제출 즉시 채점되어 오답 분석 및 출처 가이드를 제시합니다.
                  </p>
                  <button
                    onClick={startExam}
                    style={{
                      background: C.purple,
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 30px",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    시험 시작하기 (제한시간 10분)
                  </button>
                </div>
              )}

              {examStarted && !examFinished && (
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  {/* 타이머 및 진척도 헤더 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.03)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: C.subtle, fontWeight: 700 }}>
                      진행도: {currentExamIdx + 1} / {examQuestions.length} 문항
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        color: examTimer < 60 ? C.red : C.green,
                        background: C.surfaceCard,
                        padding: "4px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      ⏱️ 남은시간: {Math.floor(examTimer / 60)}분 {examTimer % 60}초
                    </span>
                  </div>

                  {/* 활성 문제 */}
                  {examQuestions.length > 0 && (
                    <div
                      style={{
                        background: C.surfaceCard,
                        padding: "20px",
                        borderRadius: "12px",
                        border: `1px solid ${C.border}`,
                        marginBottom: "20px",
                        flexGrow: 1,
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", background: C.purple, padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                          Q {currentExamIdx + 1}
                        </span>
                        <span style={{ fontSize: "10px", color: C.muted, fontWeight: 700 }}>
                          {examQuestions[currentExamIdx].type === "choice"
                            ? "객관식"
                            : examQuestions[currentExamIdx].type === "tf"
                            ? "O/X"
                            : "단답형/서술형"}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", lineHeight: 1.4, margin: "0 0 16px 0" }}>
                        {examQuestions[currentExamIdx].question}
                      </h4>

                      {/* 답안 작성 컴포넌트 */}
                      {examQuestions[currentExamIdx].type === "choice" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {examQuestions[currentExamIdx].options.map((opt, oIdx) => {
                            const isSelected = examAnswers[examQuestions[currentExamIdx].id] === opt;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleExamAnswer(opt)}
                                style={{
                                  textAlign: "left",
                                  padding: "12px 16px",
                                  borderRadius: "8px",
                                  background: isSelected ? "rgba(99, 102, 241, 0.18)" : C.surface,
                                  border: `1.5px solid ${isSelected ? C.indigo : C.border}`,
                                  color: isSelected ? "#fff" : C.subtle,
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  transition: "all 0.15s",
                                }}
                              >
                                {oIdx + 1}. {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {examQuestions[currentExamIdx].type === "tf" && (
                        <div style={{ display: "flex", gap: "12px" }}>
                          {["O", "X"].map((opt) => {
                            const isSelected = examAnswers[examQuestions[currentExamIdx].id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleExamAnswer(opt)}
                                style={{
                                  flex: 1,
                                  padding: "16px",
                                  borderRadius: "8px",
                                  background: isSelected ? "rgba(99, 102, 241, 0.18)" : C.surface,
                                  border: `1.5px solid ${isSelected ? C.indigo : C.border}`,
                                  color: isSelected ? "#fff" : C.subtle,
                                  fontSize: "18px",
                                  fontWeight: 900,
                                  cursor: "pointer",
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {examQuestions[currentExamIdx].type !== "choice" && examQuestions[currentExamIdx].type !== "tf" && (
                        <div>
                          <textarea
                            value={examAnswers[examQuestions[currentExamIdx].id] || ""}
                            onChange={(e) => handleExamAnswer(e.target.value)}
                            placeholder="정확한 단답 정답 또는 설명식 답변을 입력하세요..."
                            style={{
                              width: "100%",
                              height: "100px",
                              padding: "12px",
                              borderRadius: "8px",
                              background: C.surface,
                              border: `1px solid ${C.border}`,
                              color: "#fff",
                              fontSize: "13px",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 하단 제어 바 */}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                      disabled={currentExamIdx === 0}
                      onClick={() => setCurrentExamIdx((prev) => prev - 1)}
                      style={{
                        background: C.surfaceCard,
                        border: `1px solid ${C.border}`,
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "8px 20px",
                        cursor: "pointer",
                      }}
                    >
                      이전
                    </button>

                    {currentExamIdx === examQuestions.length - 1 ? (
                      <button
                        onClick={finishExam}
                        style={{
                          background: C.green,
                          border: "none",
                          color: "#fff",
                          borderRadius: "6px",
                          padding: "8px 24px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        최종 답안 제출
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentExamIdx((prev) => prev + 1)}
                        style={{
                          background: C.purple,
                          border: "none",
                          color: "#fff",
                          borderRadius: "6px",
                          padding: "8px 24px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        다음 문항
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 채점 완료 보고서 화면 */}
              {examFinished && examResult && (
                <div style={{ flexGrow: 1, overflowY: "auto", maxHeight: "420px", paddingRight: "6px" }}>
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      border: `1.5px solid ${C.green}`,
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: C.green, fontWeight: 700, marginBottom: "4px" }}>
                      진단 점수 결과
                    </div>
                    <div style={{ fontSize: "38px", fontWeight: 900, color: C.green }}>{examResult.score} 점</div>
                    <div style={{ fontSize: "13px", color: C.subtle, marginTop: "8px" }}>
                      합격 기준은 60점 이상입니다. (정답: {examResult.corrects} / 오답: {examResult.wrongs})
                    </div>
                  </div>

                  {/* 오답 해설 가이드 */}
                  <h3 style={{ fontSize: "14px", color: C.purpleLight, margin: "0 0 12px 0", fontWeight: 800 }}>
                    오답 분석 및 추천 가이드
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {examResult.details.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          background: C.surfaceCard,
                          padding: "16px",
                          borderRadius: "10px",
                          borderLeft: `4px solid ${item.isCorrect ? C.green : C.red}`,
                          borderTop: `1px solid ${C.border}`,
                          borderRight: `1px solid ${C.border}`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: item.isCorrect ? C.green : C.red }}>
                            문항 {idx + 1} - {item.isCorrect ? "정답" : "오답"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#fff", fontWeight: 700, marginBottom: "8px" }}>
                          {item.question}
                        </div>
                        <div style={{ fontSize: "12px", color: C.subtle, marginBottom: "4px" }}>
                          제출 답안: <span style={{ color: C.indigo, fontWeight: 700 }}>{item.userAns}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: C.subtle, marginBottom: "8px" }}>
                          모범 정답: <span style={{ color: C.green, fontWeight: 700 }}>{item.dbAns}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: C.muted, background: C.surface, padding: "8px 10px", borderRadius: "6px", border: `1px solid ${C.border}` }}>
                          💡 해설: {item.explanation}
                        </div>

                        {item.citationText && (
                          <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => triggerCitation(item.citationDocId, item.citationText)}
                              style={{
                                background: "rgba(139, 92, 246, 0.15)",
                                border: `1px solid ${C.purple}`,
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "10px",
                                color: C.purpleLight,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              🔗 관련 본문 문장 하이라이트
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button
                      onClick={() => setExamFinished(false)}
                      style={{
                        background: C.purple,
                        border: "none",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "8px 24px",
                        cursor: "pointer",
                      }}
                    >
                      새로운 모의고사 준비
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 탭 4: AI 오디오 브리핑 (팟캐스트) ── */}
          {activeTab === "podcast" && (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", margin: 0, fontWeight: 800 }}>
                  AI 팟캐스트 오디오 브리핑
                </h2>
                <p style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                  이지원(Female), 김민우(Male) AI 아나운서가 솔루션 핵심 기출 경향을 오디오 대화 형식으로 풀어줍니다.
                </p>
              </div>

              {/* 브리핑 플레이어 헤더 */}
              <div
                style={{
                  background: C.surfaceCard,
                  borderRadius: "14px",
                  border: `1.5px solid ${isPlayingPodcast ? C.purple : C.border}`,
                  padding: "20px",
                  marginBottom: "20px",
                  boxShadow: shadowLg,
                }}
              >
                {/* AI 호스트 메타 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "28px" }}>👩‍💼</span>
                      <div style={{ fontSize: "10px", color: C.purpleLight, fontWeight: 700, marginTop: "2px" }}>
                        Host 이지원
                      </div>
                    </div>
                    <div style={{ width: "1px", height: "40px", background: C.border }} />
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "28px" }}>👨‍💼</span>
                      <div style={{ fontSize: "10px", color: C.blue, fontWeight: 700, marginTop: "2px" }}>
                        Host 김민우
                      </div>
                    </div>
                  </div>

                  {/* 음속 및 제어 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: C.muted, fontWeight: 700 }}>속도 조절:</span>
                    {[0.8, 1.0, 1.2, 1.5].map((sp) => (
                      <button
                        key={sp}
                        onClick={() => setPodcastSpeed(sp)}
                        style={{
                          background: podcastSpeed === sp ? C.purple : "transparent",
                          border: `1px solid ${podcastSpeed === sp ? C.purpleLight : C.border}`,
                          color: "#fff",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          fontSize: "10px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* 플레이어 조작 바 및 파형 */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <button
                    onClick={playPodcast}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.purple}, ${C.indigo})`,
                      border: "none",
                      color: "#fff",
                      fontSize: "18px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                    }}
                  >
                    {isPlayingPodcast ? "⏸️" : "▶️"}
                  </button>

                  <button
                    onClick={stopPodcast}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    종료 및 리셋
                  </button>

                  {/* 모션 오디오 파형 (CSS 애니메이션) */}
                  <div style={{ flexGrow: 1, height: "40px", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", paddingLeft: "10px" }}>
                    <style>{`
                      @keyframes wave-dance {
                        0%, 100% { height: 4px; }
                        50% { height: 30px; }
                      }
                    `}</style>
                    {Array.from({ length: 24 }).map((_, i) => {
                      return (
                        <div
                          key={i}
                          style={{
                            width: "3px",
                            height: "4px",
                            background: i % 2 === 0 ? C.purple : C.blue,
                            borderRadius: "1.5px",
                            animation: isPlayingPodcast ? `wave-dance 1.2s ease-in-out infinite` : 'none',
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 스크롤 실시간 자막 대본 */}
              <div
                style={{
                  flexGrow: 1,
                  maxHeight: "240px",
                  overflowY: "auto",
                  background: C.surfaceCard,
                  borderRadius: "12px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {PODCAST_SCRIPT.map((line, idx) => {
                  const isCurrent = currentPodcastIdx === idx;
                  return (
                    <div
                      key={idx}
                      ref={(el) => (transcriptRefs.current[idx] = el)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: isCurrent ? "rgba(139, 92, 246, 0.12)" : "transparent",
                        border: `1px solid ${isCurrent ? C.purple : "transparent"}`,
                        transition: "all 0.3s",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "11px",
                          color: line.speaker === "이지원" ? C.purpleLight : C.blue,
                          marginRight: "8px",
                        }}
                      >
                        [{line.speaker}]
                      </span>
                      <span style={{ fontSize: "12.5px", color: isCurrent ? "#fff" : C.subtle, lineHeight: 1.5 }}>
                        {line.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 탭 5: 문제 보관함 및 관리 ── */}
          {activeTab === "bank" && (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h2 style={{ fontSize: "18px", color: "#fff", margin: 0, fontWeight: 800 }}>
                    문제 보관 대시보드
                  </h2>
                  <p style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>
                    출제/저장된 오케스트로 전체 문항을 필터링 관리하고 Excel 파일로 로컬 다운로드합니다.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setQuestionModal({ mode: "add", data: null })}
                    style={{
                      background: C.purple,
                      border: "none",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ➕ 문제 추가
                  </button>
                  <button
                    onClick={exportToExcel}
                    style={{
                      background: C.green,
                      border: "none",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    📥 Excel 내보내기
                  </button>
                </div>
              </div>

              {/* 통계 막대 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  background: C.surfaceCard,
                  padding: "16px",
                  borderRadius: "12px",
                  border: `1px solid ${C.border}`,
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "11px", color: C.muted, margin: "0 0 10px 0", fontWeight: 700 }}>
                    솔루션별 비중 (전체: {totalBankCount}문항)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { key: "CB", val: cbCount, col: C.blue },
                      { key: "VL", val: vlCount, col: C.purple },
                      { key: "SP", val: spCount, col: C.teal },
                      { key: "CL", val: clCount, col: C.indigo },
                    ].map((s) => (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: C.subtle, width: "24px", fontWeight: 700 }}>
                          {s.key}
                        </span>
                        <div style={{ flexGrow: 1, background: "rgba(255,255,255,0.06)", height: "6px", borderRadius: "3px" }}>
                          <div
                            style={{
                              width: `${totalBankCount ? (s.val / totalBankCount) * 100 : 0}%`,
                              height: "100%",
                              background: s.col,
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "10px", color: C.muted }}>{s.val}개</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "11px", color: C.muted, margin: "0 0 10px 0", fontWeight: 700 }}>
                    유형별 분포
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { label: "객관식", val: choiceCount, col: C.indigo },
                      { label: "O/X", val: tfCount, col: C.purple },
                      { label: "단답형", val: shortCount, col: C.teal },
                      { label: "서술형", val: essayCount, col: C.amber },
                    ].map((t) => (
                      <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: C.subtle, width: "36px", fontWeight: 700 }}>
                          {t.label}
                        </span>
                        <div style={{ flexGrow: 1, background: "rgba(255,255,255,0.06)", height: "6px", borderRadius: "3px" }}>
                          <div
                            style={{
                              width: `${totalBankCount ? (t.val / totalBankCount) * 100 : 0}%`,
                              height: "100%",
                              background: t.col,
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "10px", color: C.muted }}>{t.val}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 필터 탐색 바 */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="문제 본문 및 해설 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    flexGrow: 1,
                  }}
                />

                <select
                  value={bankFilterSol}
                  onChange={(e) => setBankFilterSol(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  <option value="all">모든 솔루션</option>
                  <option value="contrabass">Contrabass</option>
                  <option value="viola">Viola</option>
                  <option value="symphony">Symphony AI</option>
                  <option value="clarinet">Clarinet</option>
                </select>

                <select
                  value={bankFilterType}
                  onChange={(e) => setBankFilterType(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  <option value="all">모든 유형</option>
                  <option value="choice">객관식</option>
                  <option value="tf">O/X</option>
                  <option value="short">단답형</option>
                  <option value="essay">서술형</option>
                </select>

                <select
                  value={bankFilterDiff}
                  onChange={(e) => setBankFilterDiff(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  <option value="all">모든 난이도</option>
                  <option value="easy">초급</option>
                  <option value="medium">중급</option>
                  <option value="hard">고급</option>
                </select>
              </div>

              {/* 보관함 리스트 테이블 */}
              <div style={{ flexGrow: 1, overflowY: "auto", maxHeight: "300px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: "10px", textAlign: "left", color: C.muted }}>솔루션</th>
                      <th style={{ padding: "10px", textAlign: "left", color: C.muted }}>유형</th>
                      <th style={{ padding: "10px", textAlign: "left", color: C.muted }}>난이도</th>
                      <th style={{ padding: "10px", textAlign: "left", color: C.muted }}>문제 내용</th>
                      <th style={{ padding: "10px", textAlign: "center", color: C.muted }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBankQuestions.map((q) => (
                      <tr key={q.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: C.purpleLight }}>
                          {q.solution.toUpperCase()}
                        </td>
                        <td style={{ padding: "10px", color: C.subtle }}>
                          {q.type === "choice" ? "객관식" : q.type === "tf" ? "O/X" : q.type === "short" ? "단답형" : "서술형"}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            fontWeight: 700,
                            color: q.difficulty === "hard" ? C.red : q.difficulty === "medium" ? C.amber : C.green,
                          }}
                        >
                          {q.difficulty === "hard" ? "고급" : q.difficulty === "medium" ? "중급" : "초급"}
                        </td>
                        <td style={{ padding: "10px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "260px" }}>
                          {q.question}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => setQuestionModal({ mode: "edit", data: q })}
                            style={{
                              marginRight: "6px",
                              background: "rgba(255,255,255,0.06)",
                              border: `1px solid ${C.border}`,
                              color: "#fff",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              cursor: "pointer",
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              border: `1px solid ${C.red}`,
                              color: C.red,
                              borderRadius: "4px",
                              padding: "2px 6px",
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredBankQuestions.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: C.muted }}>
                          조건에 부합하는 문항이 문제은행에 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── 우측: 문서 뷰어 패널 (노트북LM 핵심 디자인 컴포넌트) ── */}
        {activeTab !== "bank" && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "16px",
              border: `1px solid ${C.border}`,
              padding: "20px",
              boxShadow,
              display: "flex",
              flexDirection: "column",
              maxHeight: "600px",
            }}
          >
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "10px", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "13px", color: C.purpleLight, margin: 0, fontWeight: 800 }}>
                📖 원본 소스 문서 검증 뷰어
              </h3>
              <p style={{ fontSize: "10px", color: C.muted, marginTop: "2px", margin: 0 }}>
                선택된 지식 문서의 본문입니다. AI 대화/해설에서 배지 링크를 누르면 본문이 강조됩니다.
              </p>
            </div>

            <div
              ref={docViewerRef}
              style={{
                flexGrow: 1,
                overflowY: "auto",
                fontSize: "12px",
                lineHeight: "1.6",
                color: C.subtle,
                paddingRight: "6px",
              }}
            >
              {(() => {
                const currentDoc = (documents[selectedSolution] || []).find((d) => d.id === selectedDocId);
                if (!currentDoc) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
                      선택된 문서가 존재하지 않습니다.
                    </div>
                  );
                }

                // 본문 텍스트 렌더링 및 하이라이트 매칭
                const paragraphs = currentDoc.content.split("\n");
                return (
                  <div>
                    <h4 style={{ fontSize: "14px", color: "#fff", fontWeight: 800, margin: "0 0 12px 0" }}>
                      {currentDoc.title}
                    </h4>
                    {paragraphs.map((p, idx) => {
                      const containsHighlight = highlightText && p.includes(highlightText.slice(0, 15));
                      return (
                        <p
                          key={idx}
                          className="doc-paragraph"
                          style={{
                            marginBottom: "12px",
                            padding: containsHighlight ? "8px" : "0",
                            borderRadius: "4px",
                            background: containsHighlight ? "rgba(245, 158, 11, 0.15)" : "transparent",
                            borderLeft: containsHighlight ? `3px solid ${C.amber}` : "none",
                            transition: "all 0.3s",
                          }}
                        >
                          {p}
                        </p>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── 새 소스 문서 추가 모달 ── */}
      {addSourceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: "14px",
              border: `1px solid ${C.border}`,
              width: "480px",
              padding: "24px",
              boxShadow: shadowLg,
              color: "#fff",
            }}
          >
            <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800 }}>새로운 소스 가이드 문서 등록</h3>
            <form onSubmit={addNewSource} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  문서 제목
                </label>
                <input
                  type="text"
                  required
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  placeholder="예: Contrabass HA 튜닝 매뉴얼"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  문서 내용
                </label>
                <textarea
                  required
                  rows={8}
                  value={newSourceContent}
                  onChange={(e) => setNewSourceContent(e.target.value)}
                  placeholder="노트북LM이 질문 및 문제 출제에 활용할 학습 가이드 본문 내용을 기재해 주세요..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setAddSourceModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    background: C.purple,
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 수동 문제 추가 및 편집 모달 ── */}
      {questionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: "14px",
              border: `1px solid ${C.border}`,
              width: "520px",
              padding: "24px",
              boxShadow: shadowLg,
              color: "#fff",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 800 }}>
              {questionModal.mode === "add" ? "신규 기출문제 추가 등록" : "기출문제 상세 정보 수정"}
            </h3>

            <form onSubmit={saveCustomQuestion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                    해당 솔루션
                  </label>
                  <select
                    name="solution"
                    defaultValue={questionModal.data?.solution || "contrabass"}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                    }}
                  >
                    <option value="contrabass">Contrabass</option>
                    <option value="viola">Viola</option>
                    <option value="symphony">Symphony AI</option>
                    <option value="clarinet">Clarinet</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                    출제 난이도
                  </label>
                  <select
                    name="difficulty"
                    defaultValue={questionModal.data?.difficulty || "medium"}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                    }}
                  >
                    <option value="easy">초급</option>
                    <option value="medium">중급</option>
                    <option value="hard">고급</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                    문제 유형
                  </label>
                  <select
                    name="type"
                    defaultValue={questionModal.data?.type || "choice"}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                    }}
                  >
                    <option value="choice">객관식</option>
                    <option value="tf">O/X 진위형</option>
                    <option value="short">주관식 단답형</option>
                    <option value="essay">기술 서술형</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  문제 문구
                </label>
                <textarea
                  name="question"
                  required
                  rows={2}
                  defaultValue={questionModal.data?.question || ""}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  보기 리스트 (객관식 전용, 쉼표로 구분하여 4개 작성)
                </label>
                <input
                  type="text"
                  name="options"
                  defaultValue={questionModal.data?.options ? questionModal.data.options.join(", ") : ""}
                  placeholder="예: 보기1, 보기2, 보기3, 보기4"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                    정답값
                  </label>
                  <input
                    type="text"
                    name="answer"
                    required
                    defaultValue={questionModal.data?.answer || ""}
                    placeholder="객관식은 해당 문구, O/X는 O 또는 X"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                    매핑 소스 문서 ID (옵션)
                  </label>
                  <input
                    type="text"
                    name="citationDocId"
                    defaultValue={questionModal.data?.citationDocId || ""}
                    placeholder="예: cb_doc_1, vl_doc_1 등"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.border}`,
                      color: "#fff",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  출처 본문 매핑 문구 (옵션 - 원본 스크롤 매핑용)
                </label>
                <input
                  type="text"
                  name="citationText"
                  defaultValue={questionModal.data?.citationText || ""}
                  placeholder="문서 원본에서 하이라이트할 핵심 문장을 기재해 주세요"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: C.muted, display: "block", marginBottom: "4px" }}>
                  문제 상세 해설
                </label>
                <textarea
                  name="explanation"
                  required
                  rows={3}
                  defaultValue={questionModal.data?.explanation || ""}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: C.surfaceCard,
                    border: `1px solid ${C.border}`,
                    color: "#fff",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setQuestionModal(null)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    background: C.purple,
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
