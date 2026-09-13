// chart.js/auto는 모든 차트 타입·플러그인을 번들에 넣는다. 이 사이트는 라인 차트만 쓰므로 필요한 부품만 등록한다.
import { Chart, CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export default Chart;
