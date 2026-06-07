// 원본 index.html footer 이식 — 가이드 링크 + 데이터 출처/계산 기준/주의사항
export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-guide">
        <strong>가이드</strong>
        <div className="foot-links">
          <a href="/guide/standard-score/">LEET 표준점수 계산법 정리</a>
          <a href="/guide/conversion-formulas/">25개 로스쿨 환산식 정리</a>
          <a href="/schools/">학교별 환산점수·커트라인</a>
        </div>
      </div>

      <details className="foot-section" open>
        <summary>데이터 출처</summary>
        <p><strong>표준점수:</strong> 2009–2025학년도는 suomessa 블로그에 정리된 법학전문대학원협의회 공식 환산표, 2026학년도는 로연(lawyeon.kr) 환산표를 사용했습니다.</p>
        <p><strong>학교별 환산식:</strong> 25개 로스쿨 2026학년도 모집요강을 각 대학교 입학처 공식 자료 기준으로 반영했습니다.</p>
        <p><strong>커트라인:</strong> 2026학년도 합격자 상위 50% 기준이며, 25개교 전체를 반영했습니다.</p>
      </details>

      <details className="foot-section">
        <summary>계산 기준</summary>
        <p><strong>구리트(2009–2019):</strong> 두 영역 모두 평균 50, 표준편차 10을 기준으로 계산합니다.</p>
        <p><strong>신리트(2020~):</strong> 언어이해 평균 45·SD 9, 추리논증 평균 60·SD 12를 기준으로 계산합니다.</p>
        <p>표에 직접 명시된 값은 그대로 사용하고, 표 범위 밖 원점수는 평균/표준편차에 기반해 보정합니다.</p>
      </details>

      <details className="foot-section">
        <summary>주의사항</summary>
        <p><strong>합계 추정 백분위:</strong> 영역별 백분위의 기하평균으로 근사한 참고값입니다. 정확한 값은 응시자 전체의 합계 분포가 필요합니다.</p>
        <p><strong>학교별 환산점수:</strong> 일부 환산표는 모집요강 표가 길거나 일부 구간만 공개되어 보간/추정값이 포함될 수 있습니다.</p>
        <p>실제 입시에서는 학교별 환산식과 모집요강 기준을 우선 확인하세요.</p>
      </details>
    </footer>
  );
}
