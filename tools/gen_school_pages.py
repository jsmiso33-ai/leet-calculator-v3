# -*- coding: utf-8 -*-
"""
학교별 환산점수 정적 페이지 생성기.

data/schools.js 의 LAW_SCHOOLS 메타데이터와 ADMISSION_2026 입시결과를 그대로 옮겨와,
검색 유입용 정적 페이지(schools/<slug>/index.html) 25개 + 허브(schools/index.html)를
찍어내고 sitemap.xml 을 다시 생성한다.

data/schools.js 가 바뀌면 아래 SCHOOLS 표를 함께 갱신할 것. (Node 부재로 직접 import 대신 미러링)

실행:  python tools/gen_school_pages.py
"""
import os
import html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://leet-calculator.site"
TODAY = "2026-05-30"

# ---------------------------------------------------------------------------
# 입력 데이터 (data/schools.js 미러)
# ---------------------------------------------------------------------------
# adm 필드: enrolled, leet(val,max,label,unit), leet75, leet25(opt), gpa(val,max,label,note),
#           eng(opt: val,max,label,note), ref(opt)
SCHOOLS = [
    {"name":"서울대","slug":"seoul","full":"서울대학교","group":"서울","ratio":30.0,
     "leetMax":60,"gpaMax":60,"engMax":None,"engType":"pf","totalMax":200,
     "note":"LEET는 백분위 기반 (표점 아님). 정성평가 80점은 별도.",
     "engPF":{"toeic":None,"teps":387,"toefl":107},
     "adm":{"enrolled":152,"leet":{"v":58.83,"max":60,"label":"LEET 환산","unit":"/ 60"},
            "leet75":58.33,"gpa":{"v":58.86,"max":60,"label":"학부 환산","unit":"/ 60"}}},
    {"name":"고려대","slug":"korea","full":"고려대학교","group":"서울","ratio":41.74,
     "leetMax":200,"gpaMax":150,"engMax":None,"engType":"pf","totalMax":500,
     "note":None,"engPF":{"toeic":815,"teps":316,"toefl":94},
     "adm":{"enrolled":124,"leet":{"v":140.9,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":137.8,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"96.8%"},
            "ref":"언어 백분위 50%=96.2, 추리 백분위 50%=97.3"}},
    {"name":"연세대","slug":"yonsei","full":"연세대학교","group":"서울","ratio":35.7,
     "leetMax":150,"gpaMax":150,"engMax":None,"engType":"pf","totalMax":400,
     "note":None,"engPF":{"toeic":800,"teps":309,"toefl":90},
     "adm":{"enrolled":132,"leet":{"v":140.70,"max":150,"label":"LEET 환산","unit":"/ 150"},
            "leet75":139.70,"gpa":{"v":148.40,"max":150,"label":"학부 환산","unit":"/ 150"}}},
    {"name":"성균관대","slug":"skku","full":"성균관대학교","group":"서울","ratio":35.3,
     "leetMax":30,"gpaMax":25,"engMax":None,"engType":"pf","totalMax":85,
     "note":None,"engPF":{"toeic":830,"teps":325,"toefl":96},
     "adm":{"enrolled":132,"leet":{"v":136.6,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":134.0,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"96.4%"}}},
    {"name":"한양대","slug":"hanyang","full":"한양대학교","group":"서울","ratio":50.0,
     "leetMax":40,"gpaMax":20,"engMax":None,"engType":"pf","totalMax":80,
     "note":None,"engPF":{"toeic":800,"teps":309,"toefl":91},
     "adm":{"enrolled":105,"leet":{"v":31.710,"max":40,"label":"LEET 환산","unit":"/ 40"},
            "leet75":31.070,"gpa":{"v":18.751,"max":20,"label":"학부 환산","unit":"/ 20"}}},
    {"name":"이화여대","slug":"ewha","full":"이화여자대학교","group":"서울","ratio":35.0,
     "leetMax":70,"gpaMax":40,"engMax":20,"engType":"score","totalMax":200,
     "note":None,"engPF":None,
     "adm":{"enrolled":106,"leet":{"v":62.33,"max":70,"label":"LEET 환산","unit":"/ 70"},
            "leet75":60.70,"gpa":{"v":38.14,"max":40,"label":"학부 환산","unit":"/ 40"},
            "eng":{"v":20,"max":20,"label":"영어 환산","unit":"/ 20"}}},
    {"name":"경희대","slug":"kyunghee","full":"경희대학교","group":"서울","ratio":50.9,
     "leetMax":100,"gpaMax":100,"engMax":None,"engType":"pf","totalMax":400,
     "note":None,"engPF":{"toeic":800,"teps":309,"toefl":90},
     "adm":{"enrolled":65,"leet":{"v":135.3,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":131.2,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"97.97%"}}},
    {"name":"한국외대","slug":"hufs","full":"한국외국어대학교","group":"서울","ratio":45.8,
     "leetMax":100,"gpaMax":100,"engMax":100,"engType":"score","totalMax":450,
     "note":None,"engPF":None,
     "adm":{"enrolled":55,"leet":{"v":131.8,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":128.8,"gpa":{"v":100,"max":100,"label":"학부 환산","unit":"/ 100","note":"GPA 4.0이상=100"},
            "eng":{"v":100,"max":100,"label":"영어 환산","unit":"/ 100"}}},
    {"name":"서강대","slug":"sogang","full":"서강대학교","group":"서울","ratio":50.0,
     "leetMax":30,"gpaMax":20,"engMax":None,"engType":"pf","totalMax":70,
     "note":None,"engPF":{"toeic":700,"teps":300,"toefl":79},
     "adm":{"enrolled":42,"leet":{"v":125.6,"max":None,"label":"LEET 가군 (표점합)","unit":""},
            "leet75":121.8,"gpa":{"v":None,"max":None,"label":"학점","unit":"","note":"93.8%"},
            "ref":"나군 LEET 50%=123.2 · 학점 나군 96.1%"}},
    {"name":"중앙대","slug":"cau","full":"중앙대학교","group":"서울","ratio":38.4,
     "leetMax":100,"gpaMax":100,"engMax":100,"engType":"score","totalMax":400,
     "note":None,"engPF":None,
     "adm":{"enrolled":55,"leet":{"v":99,"max":100,"label":"LEET 환산","unit":"/ 100"},
            "leet75":99,"gpa":{"v":100,"max":100,"label":"학부 환산","unit":"/ 100","note":"환산 만점 몰림, 변별력 낮음"},
            "eng":{"v":100,"max":100,"label":"영어 환산","unit":"/ 100"}}},
    {"name":"서울시립대","slug":"uos","full":"서울시립대학교","group":"서울","ratio":50.0,
     "leetMax":35,"gpaMax":15,"engMax":10,"engType":"score","totalMax":80,
     "note":None,"engPF":None,
     "adm":{"enrolled":55,"leet":{"v":132.0,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":128.2,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"97.4%"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"TOEIC 960"}}},
    {"name":"건국대","slug":"konkuk","full":"건국대학교","group":"서울","ratio":34.97,
     "leetMax":200,"gpaMax":200,"engMax":None,"engType":"pf","totalMax":600,
     "note":None,"engPF":{"toeic":800,"teps":310,"toefl":91},
     "adm":{"enrolled":44,"leet":{"v":129.7,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":131.9,"leet25":131.8,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"97.7%"},
            "ref":"언어 55.5 + 추리 74.2"}},
    {"name":"아주대","slug":"ajou","full":"아주대학교","group":"경기/인천","ratio":45.5,
     "leetMax":30,"gpaMax":20,"engMax":20,"engType":"score","totalMax":80,
     "note":None,"engPF":None,
     "adm":{"enrolled":55,"leet":{"v":134.0,"max":None,"label":"LEET 가군 (표점합)","unit":""},
            "leet75":129.7,"leet25":129.8,"gpa":{"v":None,"max":None,"label":"학점","unit":"","note":"97.8%"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"890"},
            "ref":"나군 LEET 50%=129.7 · 학점 나군 96.0% · 영어 나군 955"}},
    {"name":"인하대","slug":"inha","full":"인하대학교","group":"경기/인천","ratio":35.0,
     "leetMax":250,"gpaMax":200,"engMax":100,"engType":"score","totalMax":750,
     "note":None,"engPF":None,
     "adm":{"enrolled":54,"leet":{"v":125.2,"max":None,"label":"LEET 가군 (표점합)","unit":""},
            "leet75":122.9,"leet25":127.8,"gpa":{"v":None,"max":None,"label":"학점 GPA","unit":"","note":"4.01 / 4.5"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"970"},
            "ref":"나군 LEET 50%=125.5 · 학점 나군 4.23 · 영어 나군 975"}},
    {"name":"부산대","slug":"pusan","full":"부산대학교","group":"지방","ratio":40.0,
     "leetMax":30,"gpaMax":30,"engMax":None,"engType":"pf","totalMax":80,
     "note":None,"engPF":{"toeic":700,"teps":285,"toefl":80},
     "adm":{"enrolled":132,"leet":{"v":19.74,"max":30,"label":"LEET 가군 환산","unit":"/ 30"},
            "leet75":19.53,"leet25":20.15,"gpa":{"v":29.45,"max":30,"label":"학부 가군 환산","unit":"/ 30"},
            "ref":"나군 LEET 50%=19.67, 학점 50%=29.50"}},
    {"name":"경북대","slug":"knu","full":"경북대학교","group":"지방","ratio":46.4,
     "leetMax":150,"gpaMax":100,"engMax":None,"engType":"pf","totalMax":300,
     "note":"분모는 매년 협의회가 발표하는 언어/추리 표점 최상위 급간 상한의 합. 2026학년도 기준 73.1+97.6=170.7",
     "engPF":{"toeic":800,"teps":310,"toefl":91},
     "adm":{"enrolled":132,"leet":{"v":127.5,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":125.2,"leet25":129.7,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"96.7%"}}},
    {"name":"전남대","slug":"jnu","full":"전남대학교","group":"지방","ratio":42.6,
     "leetMax":150,"gpaMax":150,"engMax":None,"engType":"pf","totalMax":500,
     "note":None,"engPF":{"toeic":750,"teps":285,"toefl":85},
     "adm":{"enrolled":126,"leet":{"v":125.2,"max":None,"label":"LEET 나군 (표점합)","unit":""},
            "leet75":123.2,"leet25":127.5,"gpa":{"v":None,"max":None,"label":"학점","unit":"","note":"97.8%"},
            "ref":"가군일반 LEET 50%=125.5 · 학점 가군 97.0%"}},
    {"name":"전북대","slug":"jbnu","full":"전북대학교","group":"지방","ratio":53.3,
     "leetMax":40,"gpaMax":15,"engMax":None,"engType":"pf","totalMax":75,
     "note":"LEET 환산이 시그모이드 함수","engPF":{"toeic":700,"teps":300,"toefl":80},
     "adm":{"enrolled":88,"leet":{"v":123.1,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":122.6,"leet25":125.1,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"96.6%"}}},
    {"name":"충남대","slug":"cnu","full":"충남대학교","group":"지방","ratio":69.77,
     "leetMax":120,"gpaMax":100,"engMax":100,"engType":"score","totalMax":350,
     "note":None,"engPF":None,
     "adm":{"enrolled":110,"leet":{"v":66.24,"max":120,"label":"LEET 환산","unit":"/ 120"},
            "leet75":64.63,"leet25":67.78,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"98.1%"},
            "eng":{"v":100,"max":100,"label":"영어 환산","unit":"/ 100"}}},
    {"name":"충북대","slug":"cbnu","full":"충북대학교","group":"지방","ratio":89.3,
     "leetMax":200,"gpaMax":100,"engMax":None,"engType":"pf","totalMax":330,
     "note":"학부 백분율 81.00 미만 지원 불가","engPF":{"toeic":750,"teps":286,"toefl":85},
     "adm":{"enrolled":77,"leet":{"v":168.61,"max":200,"label":"LEET 환산","unit":"/ 200"},
            "leet75":167.75,"leet25":171.47,"gpa":{"v":None,"max":None,"label":"학부","unit":"","note":"98.0%"}}},
    {"name":"강원대","slug":"kangwon","full":"강원대학교","group":"지방","ratio":44.0,
     "leetMax":150,"gpaMax":100,"engMax":None,"engType":"pf","totalMax":350,
     "note":None,"engPF":{"toeic":720,"teps":308,"toefl":75},
     "adm":{"enrolled":41,"leet":{"v":125.4,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":125.0,"leet25":127.4,"gpa":{"v":None,"max":None,"label":"학점","unit":"","note":"95.9%"}}},
    {"name":"제주대","slug":"jeju","full":"제주대학교","group":"지방","ratio":66.7,
     "leetMax":40,"gpaMax":20,"engMax":None,"engType":"pf","totalMax":60,
     "note":None,"engPF":{"toeic":710,"teps":334,"toefl":75},
     "adm":{"enrolled":44,"leet":{"v":25.096,"max":40,"label":"LEET 가군 환산","unit":"/ 40"},
            "leet75":24.744,"leet25":25.496,"gpa":{"v":19.220,"max":20,"label":"학부 가군 환산","unit":"/ 20"},
            "ref":"나군 LEET 50%=25.096, 학점 50%=19.219"}},
    {"name":"동아대","slug":"donga","full":"동아대학교","group":"지방","ratio":51.3,
     "leetMax":300,"gpaMax":100,"engMax":200,"engType":"score","totalMax":800,
     "note":"영어 명목 200점이지만 실질 0점 (사실상 P/F)","engPF":None,
     "adm":{"enrolled":86,"leet":{"v":120.9,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":118.5,"leet25":123.5,"gpa":{"v":None,"max":None,"label":"학부 GPA","unit":"","note":"4.03 / 4.5"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"TOEIC 900"}}},
    {"name":"원광대","slug":"wonkwang","full":"원광대학교","group":"지방","ratio":54.5,
     "leetMax":40,"gpaMax":20,"engMax":20,"engType":"score","totalMax":100,
     "note":None,"engPF":None,
     "adm":{"enrolled":62,"leet":{"v":116.2,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":112.0,"leet25":120.4,"gpa":{"v":None,"max":None,"label":"학부 GPA","unit":"","note":"4.12 / 4.5"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"TOEIC 935"}}},
    {"name":"영남대","slug":"yeungnam","full":"영남대학교","group":"지방","ratio":58.8,
     "leetMax":300,"gpaMax":100,"engMax":100,"engType":"score","totalMax":700,
     "note":None,"engPF":None,
     "adm":{"enrolled":76,"leet":{"v":120.5,"max":None,"label":"LEET (표점합)","unit":""},
            "leet75":116.2,"leet25":122.8,"gpa":{"v":None,"max":None,"label":"학부 GPA","unit":"","note":"4.18 / 4.5"},
            "eng":{"v":None,"max":None,"label":"영어","unit":"","note":"TOEIC 965"}}},
]

GROUP_ORDER = ["서울", "경기/인천", "지방"]

CSS = """
:root{--bg:#FAFAF9;--bg-card:#FFFFFF;--bg-tint:#F1F5F9;--bg-subtle:#F4F4F5;--ink:#18181B;--ink-soft:#27272A;--ink-mute:#71717A;--ink-tertiary:#A1A1AA;--line:rgba(24,24,27,.06);--line-strong:rgba(24,24,27,.12);--accent:#1A56DB;--accent-hover:#1747B8;--success:#15803D;--warning:#B45309;--danger:#B91C1C;--shadow-sm:0 1px 2px rgba(24,24,27,.04),0 0 0 1px rgba(24,24,27,.05);--shadow-md:0 1px 3px rgba(24,24,27,.05),0 0 0 1px rgba(24,24,27,.05);--radius-md:8px;--radius-lg:12px;--font-sans:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;--font-mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--font-sans);-webkit-font-smoothing:antialiased;letter-spacing:-.01em;line-height:1.6;padding:32px 24px 80px}
.container{max-width:760px;margin:0 auto}
.topnav{display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;border-bottom:1px solid var(--line);margin-bottom:32px}
.topnav a{color:var(--ink-mute);text-decoration:none;font-size:14px;font-weight:500;transition:color 150ms}
.topnav a:hover{color:var(--accent)}.topnav .brand{font-weight:600;color:var(--ink);font-size:14px}
.crumb{font-size:13px;color:var(--ink-tertiary);margin-bottom:14px}
.crumb a{color:var(--ink-mute);text-decoration:none}.crumb a:hover{color:var(--accent)}
header.page-header{margin-bottom:32px}
.eyebrow{display:inline-block;font-size:13px;color:var(--accent);font-weight:600;margin-bottom:12px;letter-spacing:.02em}
h1{font-size:31px;font-weight:700;letter-spacing:-.02em;line-height:1.25;color:var(--ink);margin-bottom:16px}
.lede{font-size:17px;color:var(--ink-soft);line-height:1.7}
.meta-row{display:flex;gap:16px;margin-top:16px;font-size:13px;color:var(--ink-tertiary)}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0 40px}
.stat-card{background:var(--bg-card);border:1px solid var(--line);border-radius:var(--radius-md);padding:18px 20px;box-shadow:var(--shadow-sm)}
.stat-card .sl{font-size:12px;color:var(--ink-mute);font-weight:600;margin-bottom:8px}
.stat-card .sv{font-size:24px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;font-family:var(--font-mono);letter-spacing:-.02em}
.stat-card .su{font-size:12px;color:var(--ink-tertiary);margin-left:3px;font-family:var(--font-sans)}
section.content{margin-bottom:44px;scroll-margin-top:24px}
section.content h2{font-size:23px;font-weight:700;letter-spacing:-.02em;color:var(--ink);margin-bottom:16px;padding-top:12px}
section.content p{color:var(--ink-soft);font-size:16px;line-height:1.75;margin-bottom:14px}
section.content p strong{color:var(--ink);font-weight:600}
section.content ul{list-style:none;margin-bottom:16px}
section.content ul li{position:relative;padding-left:20px;color:var(--ink-soft);font-size:16px;line-height:1.75;margin-bottom:6px}
section.content ul li::before{content:'';position:absolute;left:6px;top:12px;width:4px;height:4px;background:var(--ink-tertiary);border-radius:50%}
.callout{background:var(--bg-card);border:1px solid var(--line);border-left:4px solid var(--accent);padding:18px 22px;border-radius:var(--radius-md);margin:20px 0;box-shadow:var(--shadow-sm)}
.callout-label{font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.callout p{font-size:15px;margin-bottom:0}
.cmp-table{width:100%;border-collapse:collapse;margin:16px 0 20px;font-size:15px;background:var(--bg-card);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm)}
.cmp-table th,.cmp-table td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--line)}
.cmp-table th{background:var(--bg-subtle);font-weight:600;font-size:13px;color:var(--ink-mute)}
.cmp-table td{color:var(--ink-soft);font-variant-numeric:tabular-nums}
.cmp-table td.num{font-family:var(--font-mono);font-weight:600;color:var(--ink)}
.cmp-table tr:last-child th,.cmp-table tr:last-child td{border-bottom:none}
.note-line{font-size:13px;color:var(--ink-tertiary);margin-top:-8px;margin-bottom:18px}
.faq-item{background:var(--bg-card);border:1px solid var(--line);border-radius:var(--radius-md);padding:18px 22px;margin-bottom:12px;box-shadow:var(--shadow-sm)}
.faq-q{font-weight:600;color:var(--ink);font-size:16px;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px}
.faq-q::before{content:'Q';flex-shrink:0;width:22px;height:22px;background:var(--accent);color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:var(--font-mono);margin-top:1px}
.faq-a{color:var(--ink-soft);font-size:15px;line-height:1.75;padding-left:30px}
.cta-section{margin-top:56px;padding:40px 32px;background:var(--ink);color:#fff;border-radius:var(--radius-lg);text-align:center}
.cta-section h2{font-size:23px;font-weight:700;margin-bottom:12px;letter-spacing:-.02em}
.cta-section p{color:rgba(255,255,255,.7);margin-bottom:24px;font-size:15px}
.cta-btn{display:inline-block;padding:14px 32px;background:var(--accent);color:#fff;text-decoration:none;border-radius:var(--radius-md);font-weight:600;font-size:15px;transition:background 150ms}
.cta-btn:hover{background:var(--accent-hover)}
.related{margin-top:44px;padding:24px 28px;background:var(--bg-tint);border-radius:var(--radius-lg)}
.related-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-mute);margin-bottom:12px}
.related a{color:var(--accent);text-decoration:none;font-weight:600;font-size:15px}
.chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.chip-row a{display:inline-block;padding:7px 13px;background:var(--bg-card);border:1px solid var(--line-strong);border-radius:999px;font-size:14px;font-weight:500;color:var(--ink-soft);text-decoration:none;transition:all 150ms}
.chip-row a:hover{border-color:var(--accent);color:var(--accent)}
footer{margin-top:48px;padding-top:24px;border-top:1px solid var(--line);font-size:13px;color:var(--ink-tertiary);text-align:center}
footer a{color:var(--ink-mute);text-decoration:none}
.hub-group{margin-bottom:36px}
.hub-group h2{font-size:15px;font-weight:700;color:var(--ink-mute);margin-bottom:14px;text-transform:uppercase;letter-spacing:.04em}
.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.hub-card{display:block;background:var(--bg-card);border:1px solid var(--line);border-radius:var(--radius-md);padding:18px 20px;text-decoration:none;box-shadow:var(--shadow-sm);transition:all 150ms}
.hub-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow-md)}
.hub-card .hn{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:6px}
.hub-card .hm{font-size:13px;color:var(--ink-mute);font-variant-numeric:tabular-nums}
@media(max-width:640px){body{padding:20px 16px 60px}h1{font-size:24px}section.content h2{font-size:20px}.stat-grid{grid-template-columns:1fr;gap:10px}.cta-section{padding:32px 20px}}
"""


def esc(s):
    return html.escape(str(s), quote=True)


def fmt(v):
    """숫자 표시: 정수면 정수로, 소수면 불필요한 0 제거."""
    if v is None:
        return "—"
    if isinstance(v, float):
        if v == int(v):
            return str(int(v))
        return ("%.3f" % v).rstrip("0").rstrip(".")
    return str(v)


def disp(v, unit):
    """값 + 단위(예 '/ 60')를 보기 좋게 결합. 단위 없으면 값만."""
    if unit:
        return (fmt(v) + " " + unit).strip()
    return fmt(v)


def eng_text(s):
    """영어 반영 방식 문장."""
    if s["engType"] == "score":
        mx = s["engMax"]
        if s["name"] == "동아대":
            return "공인영어를 명목상 점수로 반영하지만 실질 변별력은 거의 없습니다(사실상 P/F)."
        return f"공인영어를 <strong>{mx}점 만점</strong>으로 점수 반영합니다."
    pf = s.get("engPF") or {}
    parts = []
    if pf.get("toeic"):
        parts.append(f"TOEIC {pf['toeic']}")
    if pf.get("teps"):
        parts.append(f"TEPS {pf['teps']}")
    if pf.get("toefl"):
        parts.append(f"TOEFL {pf['toefl']}")
    crit = " · ".join(parts)
    if crit:
        return f"공인영어는 <strong>P/F(통과/미달)</strong> 방식이며, {crit} 이상이면 통과입니다."
    return "공인영어는 P/F(통과/미달) 방식입니다."


def leet_method_text(s):
    label = s["adm"]["leet"]["label"]
    if s["name"] == "서울대":
        base = "서울대는 LEET를 표준점수가 아닌 <strong>백분위</strong>로 반영합니다(언어이해 40% + 추리논증 60% 가중)."
    elif "표점합" in label:
        if s["leetMax"]:
            base = f"언어이해·추리논증 <strong>표준점수의 합(표점합)</strong>을 환산표에 대입해 LEET 환산점수(만점 {s['leetMax']}점)를 산출합니다."
        else:
            base = "언어이해·추리논증 <strong>표준점수의 합(표점합)</strong>을 그대로 반영하거나 환산표에 대입합니다."
    else:
        base = f"언어이해·추리논증 표준점수를 모집요강 환산식에 대입해 LEET 환산점수(만점 {s['leetMax']}점)를 산출합니다."
    return base


def page_html(s, others_same_group):
    name, full, slug = s["name"], s["full"], s["slug"]
    adm = s["adm"]
    leet = adm["leet"]
    ratio = fmt(s["ratio"])
    title = f"{name} 로스쿨 LEET 환산점수·커트라인 (2026학년도) · LEET 표준점수 계산기"
    desc = (f"{full} 법학전문대학원의 LEET 반영 비율 {ratio}%, 환산 방식, "
            f"2026학년도 합격자 LEET 커트라인(상위 50% {disp(leet['v'], leet['unit'])}), "
            f"학점·영어 반영까지 한 페이지에 정리.")
    keywords = (f"{name} 로스쿨,{name} 환산점수,{name} 로스쿨 커트라인,{full} 법학전문대학원,"
                f"{name} LEET,{name} 로스쿨 입결,로스쿨 환산점수,LEET 환산")
    url = f"{SITE}/schools/{slug}/"

    # 핵심 지표 카드
    leet50_disp = f'{fmt(leet["v"])}<span class="su">{esc(leet["unit"])}</span>' if leet["unit"] else fmt(leet["v"])
    stats = f"""
  <div class="stat-grid">
    <div class="stat-card"><div class="sl">LEET 반영 비율</div><div class="sv">{ratio}<span class="su">%</span></div></div>
    <div class="stat-card"><div class="sl">2026 등록 인원</div><div class="sv">{adm['enrolled']}<span class="su">명</span></div></div>
    <div class="stat-card"><div class="sl">LEET 상위 50% (중위)</div><div class="sv">{leet50_disp}</div></div>
  </div>"""

    # 입시결과 테이블
    rows = []
    rows.append(f'<tr><th>등록 인원</th><td class="num">{adm["enrolled"]}명</td></tr>')
    rows.append(f'<tr><th>{esc(leet["label"])} · 상위 50%</th><td class="num">{esc(disp(leet["v"], leet["unit"]))}</td></tr>')
    if adm.get("leet25") is not None:
        rows.append(f'<tr><th>LEET · 상위 25%</th><td class="num">{esc(disp(adm["leet25"], leet["unit"]))}</td></tr>')
    if adm.get("leet75") is not None:
        rows.append(f'<tr><th>LEET · 상위 75%</th><td class="num">{esc(disp(adm["leet75"], leet["unit"]))}</td></tr>')
    g = adm["gpa"]
    gpa_val = (esc(disp(g["v"], g["unit"])) if g["v"] is not None else esc(g.get("note", "—")))
    rows.append(f'<tr><th>{esc(g["label"])} · 상위 50%</th><td class="num">{gpa_val}</td></tr>')
    if adm.get("eng"):
        e = adm["eng"]
        eng_val = (esc(disp(e["v"], e["unit"])) if e["v"] is not None else esc(e.get("note", "—")))
        rows.append(f'<tr><th>{esc(e["label"])} · 상위 50%</th><td class="num">{eng_val}</td></tr>')
    adm_table = '<table class="cmp-table"><tbody>' + "".join(rows) + "</tbody></table>"
    ref_html = f'<p class="note-line">참고: {esc(adm["ref"])}</p>' if adm.get("ref") else ""

    note_html = ""
    if s.get("note"):
        note_html = f'<div class="callout"><div class="callout-label">참고</div><p>{esc(s["note"])}</p></div>'

    # 관련 학교 칩
    chips = "".join(
        f'<a href="/schools/{o["slug"]}/">{esc(o["name"])} 로스쿨</a>'
        for o in others_same_group
    )

    # FAQ
    faq_q1 = f"{name} 로스쿨은 LEET를 어떻게 반영하나요?"
    faq_a1 = f'{leet_method_text(s)} 정량 전형에서 LEET가 차지하는 비중은 약 {ratio}%입니다.'
    faq_q2 = f"2026학년도 {name} 로스쿨 LEET 커트라인은 얼마였나요?"
    faq_a2 = (f'2026학년도 합격자 상위 50%(중위) 기준 {esc(leet["label"])} 점수는 {esc(disp(leet["v"], leet["unit"]))}, '
              f'등록 인원은 {adm["enrolled"]}명이었습니다. 상위 75% 기준은 {esc(disp(adm.get("leet75"), leet["unit"]))}입니다.')
    faq_q3 = f"{name} 로스쿨 공인영어 기준은 어떻게 되나요?"
    faq_a3 = eng_text(s)
    faq_plain_a1 = re.sub("<[^>]+>", "", faq_a1)
    faq_plain_a2 = re.sub("<[^>]+>", "", faq_a2)
    faq_plain_a3 = re.sub("<[^>]+>", "", faq_a3)

    faq_ld = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": faq_q1, "acceptedAnswer": {"@type": "Answer", "text": faq_plain_a1}},
            {"@type": "Question", "name": faq_q2, "acceptedAnswer": {"@type": "Answer", "text": faq_plain_a2}},
            {"@type": "Question", "name": faq_q3, "acceptedAnswer": {"@type": "Answer", "text": faq_plain_a3}},
        ],
    }
    breadcrumb_ld = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "LEET 표준점수 계산기", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "학교별 환산점수", "item": SITE + "/schools/"},
            {"@type": "ListItem", "position": 3, "name": f"{name} 로스쿨", "item": url},
        ],
    }
    article_ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": f"{name} 로스쿨 LEET 환산점수·커트라인 (2026학년도)",
        "description": desc, "datePublished": "2026-05-30", "dateModified": TODAY,
        "author": {"@type": "Organization", "name": "LEET 표준점수 계산기"},
        "publisher": {"@type": "Organization", "name": "LEET 표준점수 계산기", "url": SITE + "/"},
        "mainEntityOfPage": url, "image": SITE + "/og-image.png", "inLanguage": "ko",
    }

    import json
    ld_blocks = "\n".join(
        '<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False) + "</script>"
        for b in (article_ld, faq_ld, breadcrumb_ld)
    )

    method_intro = leet_method_text(s)
    eng_intro = eng_text(s)
    gpa_max_txt = f'학부 성적(학점)은 {s["gpaMax"]}점 만점으로 반영합니다.'

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}" />
<meta name="keywords" content="{esc(keywords)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="{esc(name)} 로스쿨 LEET 환산점수·커트라인 (2026)" />
<meta property="og:description" content="{esc(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:site_name" content="LEET 표준점수 계산기" />
<meta property="og:locale" content="ko_KR" />
<meta property="og:image" content="{SITE}/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{esc(name)} 로스쿨 LEET 환산점수·커트라인 (2026)" />
<meta name="twitter:description" content="{esc(desc)}" />
<meta name="twitter:image" content="{SITE}/og-image.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
{ld_blocks}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<style>{CSS}</style>
</head>
<body>
<div class="container">
  <nav class="topnav">
    <a href="/">← 메인으로</a>
    <span class="brand">LEET 표준점수 계산기</span>
  </nav>

  <div class="crumb"><a href="/">계산기</a> › <a href="/schools/">학교별 환산점수</a> › {esc(name)} 로스쿨</div>

  <header class="page-header">
    <span class="eyebrow">로스쿨 환산점수 · 2026학년도</span>
    <h1>{esc(name)} 로스쿨 LEET 환산점수 · 커트라인</h1>
    <p class="lede">
      {esc(full)} 법학전문대학원의 1단계(정량) 전형에서 LEET·학점·영어가 어떻게 환산되는지, 그리고 2026학년도 합격자 점수가 어디서 형성됐는지 정리했습니다.
    </p>
    <div class="meta-row"><span>{esc(s["group"])} 권역</span><span>·</span><span>최종 업데이트: {TODAY}</span></div>
  </header>
{stats}

  <section class="content">
    <h2>{esc(name)} 로스쿨 환산 방식</h2>
    <p>{method_intro}</p>
    <p>{gpa_max_txt} {eng_intro}</p>
    <p>정량 전형 총점은 <strong>{s["totalMax"]}점 만점</strong>이며, 이 중 LEET 비중이 약 <strong>{ratio}%</strong>로 가장 큰 축을 차지합니다. (실제 합격은 1단계 정량 통과 후 서류·면접 등 정성평가가 더해져 결정됩니다.)</p>
    {note_html}
  </section>

  <section class="content">
    <h2>2026학년도 {esc(name)} 로스쿨 입시결과</h2>
    <p>2026학년도 합격자 상위 50%(중위값) 기준입니다. 본인 점수와 비교하려면 메인 계산기의 ‘학교별 환산점수’·‘입시결과 비교’ 탭을 이용하세요.</p>
    {adm_table}
    {ref_html}
  </section>

  <section class="content">
    <h2>자주 묻는 질문</h2>
    <div class="faq-item"><div class="faq-q">{esc(faq_q1)}</div><div class="faq-a">{faq_a1}</div></div>
    <div class="faq-item"><div class="faq-q">{esc(faq_q2)}</div><div class="faq-a">{faq_a2}</div></div>
    <div class="faq-item"><div class="faq-q">{esc(faq_q3)}</div><div class="faq-a">{faq_a3}</div></div>
  </section>

  <section class="cta-section">
    <h2>내 점수로 {esc(name)} 환산점수 계산하기</h2>
    <p>LEET 표준점수·학점·영어를 입력하면 {esc(name)}를 포함한 25개 로스쿨 환산점수가 한 번에 계산됩니다.</p>
    <a class="cta-btn" href="/">계산기로 이동 →</a>
  </section>

  <div class="related">
    <div class="related-label">같은 권역 로스쿨</div>
    <div class="chip-row">{chips}</div>
    <p style="margin-top:16px;margin-bottom:0;"><a href="/schools/">전체 25개 로스쿨 환산점수 보기 →</a> &nbsp; <a href="/guide/conversion-formulas/">환산식 총정리 가이드 →</a></p>
  </div>

  <footer>
    <p>본 페이지는 {esc(full)} 2026학년도 모집요강과 공개 입시결과를 기반으로 작성되었습니다. 정확한 기준은 해당 학교 입학처 공식 자료를 확인하세요.</p>
    <p style="margin-top:8px;"><a href="/">← LEET 표준점수 계산기로 돌아가기</a></p>
  </footer>
</div>
</body>
</html>
"""


def hub_html():
    title = "로스쿨 환산점수·커트라인 25개교 정리 (2026) · LEET 표준점수 계산기"
    desc = ("전국 25개 로스쿨(법학전문대학원)의 LEET 반영 비율, 환산 방식, 2026학년도 합격자 "
            "커트라인을 학교별로 정리했습니다. 서울대·고려대·연세대부터 지방 로스쿨까지.")
    url = f"{SITE}/schools/"
    groups_html = []
    for grp in GROUP_ORDER:
        cards = []
        for s in SCHOOLS:
            if s["group"] != grp:
                continue
            leet = s["adm"]["leet"]
            cards.append(
                f'<a class="hub-card" href="/schools/{s["slug"]}/">'
                f'<div class="hn">{esc(s["name"])} 로스쿨</div>'
                f'<div class="hm">LEET 반영 {fmt(s["ratio"])}% · 50% {esc(disp(leet["v"], leet["unit"]))}</div>'
                f'</a>'
            )
        groups_html.append(
            f'<div class="hub-group"><h2>{esc(grp)}</h2><div class="hub-grid">{"".join(cards)}</div></div>'
        )
    import json
    breadcrumb_ld = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "LEET 표준점수 계산기", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "학교별 환산점수", "item": url},
        ],
    }
    item_ld = {
        "@context": "https://schema.org", "@type": "ItemList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": f'{s["name"]} 로스쿨',
             "url": f'{SITE}/schools/{s["slug"]}/'}
            for i, s in enumerate(SCHOOLS)
        ],
    }
    ld = "\n".join('<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False) + "</script>"
                   for b in (breadcrumb_ld, item_ld))
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}" />
<meta name="keywords" content="로스쿨 환산점수,로스쿨 커트라인,로스쿨 입결,LEET 환산,법학전문대학원 환산점수,로스쿨 순위" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="로스쿨 환산점수·커트라인 25개교 정리 (2026)" />
<meta property="og:description" content="{esc(desc)}" />
<meta property="og:url" content="{url}" />
<meta property="og:site_name" content="LEET 표준점수 계산기" />
<meta property="og:locale" content="ko_KR" />
<meta property="og:image" content="{SITE}/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{SITE}/og-image.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
{ld}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<style>{CSS}</style>
</head>
<body>
<div class="container">
  <nav class="topnav">
    <a href="/">← 메인으로</a>
    <span class="brand">LEET 표준점수 계산기</span>
  </nav>
  <header class="page-header">
    <span class="eyebrow">로스쿨 환산점수 · 2026학년도</span>
    <h1>전국 25개 로스쿨 환산점수 · 커트라인</h1>
    <p class="lede">학교마다 LEET를 반영하는 방식과 비중이 다릅니다. 지원할 로스쿨을 골라 환산 방식과 2026학년도 합격자 커트라인을 확인하세요.</p>
  </header>
  {"".join(groups_html)}
  <section class="cta-section">
    <h2>내 점수로 25개 학교 한 번에 비교</h2>
    <p>LEET 표준점수·학점·영어를 입력하면 모든 로스쿨 환산점수가 자동 계산됩니다.</p>
    <a class="cta-btn" href="/">계산기로 이동 →</a>
  </section>
  <footer>
    <p>2026학년도 모집요강과 공개 입시결과 기반. 정확한 기준은 각 학교 입학처 공식 자료를 확인하세요.</p>
    <p style="margin-top:8px;"><a href="/">← LEET 표준점수 계산기로 돌아가기</a></p>
  </footer>
</div>
</body>
</html>
"""


def build_sitemap():
    urls = []
    def add(loc, freq, pri, mod=TODAY):
        urls.append(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{mod}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{pri}</priority>\n  </url>")
    add(f"{SITE}/", "weekly", "1.0")
    add(f"{SITE}/schools/", "monthly", "0.9")
    for s in SCHOOLS:
        add(f"{SITE}/schools/{s['slug']}/", "monthly", "0.8")
    add(f"{SITE}/guide/standard-score/", "monthly", "0.8")
    add(f"{SITE}/guide/conversion-formulas/", "monthly", "0.8")
    for y in range(2009, 2027):
        add(f"{SITE}/exams/{y}/", "yearly", "0.6")
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"


import re  # noqa: E402 (leet_method 등에서 사용)


def main():
    n = 0
    for s in SCHOOLS:
        others = [o for o in SCHOOLS if o["group"] == s["group"] and o["slug"] != s["slug"]]
        out_dir = os.path.join(ROOT, "schools", s["slug"])
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(page_html(s, others))
        n += 1
    with open(os.path.join(ROOT, "schools", "index.html"), "w", encoding="utf-8") as f:
        f.write(hub_html())
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(build_sitemap())
    print(f"생성 완료: 학교 페이지 {n}개 + 허브 1개 + sitemap.xml")


if __name__ == "__main__":
    main()
