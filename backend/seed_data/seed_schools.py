"""
留学申请网站 - Mock 学校数据
分布：英国 50 所，美国 30 所，澳大利亚 20 所
"""

MAJORS = [
    # 计算机与工程 (10)
    "计算机科学", "软件工程", "人工智能", "数据科学", "网络安全",
    "电子工程", "机械工程", "土木工程", "生物工程", "化学工程",
    # 商科 (10)
    "工商管理", "金融学", "会计学", "市场营销", "国际商务",
    "经济学", "统计学", "供应链管理", "人力资源管理", "创业管理",
    # 自然科学 (8)
    "数学", "物理学", "化学", "生物学", "环境科学",
    "地质学", "天文学", "海洋科学",
    # 社会科学 (8)
    "心理学", "社会学", "政治学", "国际关系", "传媒学",
    "新闻学", "教育学", "社会工作",
    # 人文艺术 (7)
    "英语文学", "历史学", "哲学", "艺术史", "音乐",
    "电影研究", "语言学",
    # 医学健康 (7)
    "临床医学", "公共卫生", "护理学", "药学", "生物医学",
    "营养学", "运动科学"
]

SCHOOLS = [
    # ==================== 英国 (50 所) ====================
    # G5 超级精英大学
    {
        "name": "University of Oxford",
        "name_cn": "牛津大学",
        "country": "英国",
        "ranking": 1,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 110, "ielts": 7.5},
        "application_deadline": "2025-01-15",
        "description": "英语世界中最古老的大学，采用独特的学院制和导师制教学模式。"
    },
    {
        "name": "University of Cambridge",
        "name_cn": "剑桥大学",
        "country": "英国",
        "ranking": 2,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 110, "ielts": 7.5},
        "application_deadline": "2025-01-15",
        "description": "世界顶尖研究型大学，培养了众多诺贝尔奖得主。"
    },
    {
        "name": "Imperial College London",
        "name_cn": "帝国理工学院",
        "country": "英国",
        "ranking": 6,
        "gpa_requirement": {"min": 3.5, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-31",
        "description": "专注于科学、工程、医学和商科的世界一流大学。"
    },
    {
        "name": "London School of Economics",
        "name_cn": "伦敦政治经济学院",
        "country": "英国",
        "ranking": 45,
        "gpa_requirement": {"min": 3.5, "preferred": 3.8},
        "language_requirement": {"toefl": 107, "ielts": 7.0},
        "application_deadline": "2025-01-15",
        "description": "全球顶尖的社会科学研究和教学机构。"
    },
    {
        "name": "University College London",
        "name_cn": "伦敦大学学院",
        "country": "英国",
        "ranking": 9,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-31",
        "description": "伦敦第一所大学，学科覆盖面广，研究实力雄厚。"
    },
    # 罗素集团其他成员
    {
        "name": "University of Edinburgh",
        "name_cn": "爱丁堡大学",
        "country": "英国",
        "ranking": 22,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-06-30",
        "description": "苏格兰最古老大学之一，人文社科和计算机科学享誉全球。"
    },
    {
        "name": "University of Manchester",
        "name_cn": "曼彻斯特大学",
        "country": "英国",
        "ranking": 32,
        "gpa_requirement": {"min": 3.0, "preferred": 3.5},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "英国最大的单一校址大学，工程和商业领域实力强劲。"
    },
    {
        "name": "King's College London",
        "name_cn": "伦敦国王学院",
        "country": "英国",
        "ranking": 40,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-03-31",
        "description": "伦敦四大名校之一，医学、法律和人文社科领域卓越。"
    },
    {
        "name": "University of Bristol",
        "name_cn": "布里斯托大学",
        "country": "英国",
        "ranking": 55,
        "gpa_requirement": {"min": 3.0, "preferred": 3.4},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "英国红砖大学之一，工程和物理科学领域领先。"
    },
    {
        "name": "University of Warwick",
        "name_cn": "华威大学",
        "country": "英国",
        "ranking": 67,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-08-02",
        "description": "年轻但发展迅速，商科和数学领域尤为突出。"
    },
    {
        "name": "University of Glasgow",
        "name_cn": "格拉斯哥大学",
        "country": "英国",
        "ranking": 76,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "苏格兰第二古老大学，兽医和生命科学领域著名。"
    },
    {
        "name": "University of Birmingham",
        "name_cn": "伯明翰大学",
        "country": "英国",
        "ranking": 84,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "英国第一所公民大学，工程和商业管理领域优秀。"
    },
    {
        "name": "University of Sheffield",
        "name_cn": "谢菲尔德大学",
        "country": "英国",
        "ranking": 96,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "英国红砖大学，新闻学和建筑学领域领先。"
    },
    {
        "name": "University of Leeds",
        "name_cn": "利兹大学",
        "country": "英国",
        "ranking": 75,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "罗素集团成员，传媒和翻译专业享有盛誉。"
    },
    {
        "name": "University of Nottingham",
        "name_cn": "诺丁汉大学",
        "country": "英国",
        "ranking": 100,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 87, "ielts": 6.5},
        "application_deadline": "2025-08-01",
        "description": "拥有中国校区，药学和环境科学领域优秀。"
    },
    {
        "name": "University of Southampton",
        "name_cn": "南安普顿大学",
        "country": "英国",
        "ranking": 81,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "工程和海洋科学领域领先，电子工程尤为著名。"
    },
    {
        "name": "University of Liverpool",
        "name_cn": "利物浦大学",
        "country": "英国",
        "ranking": 176,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "英国红砖大学，建筑学和兽医学领域著名。"
    },
    {
        "name": "Newcastle University",
        "name_cn": "纽卡斯尔大学",
        "country": "英国",
        "ranking": 129,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-31",
        "description": "罗素集团成员，医学和翻译专业优秀。"
    },
    {
        "name": "University of York",
        "name_cn": "约克大学",
        "country": "英国",
        "ranking": 162,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-31",
        "description": "校园环境优美，考古学和英语文学领域领先。"
    },
    {
        "name": "Cardiff University",
        "name_cn": "卡迪夫大学",
        "country": "英国",
        "ranking": 154,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-08-01",
        "description": "威尔士顶尖大学，新闻学和建筑学领域著名。"
    },
    {
        "name": "University of Exeter",
        "name_cn": "埃克塞特大学",
        "country": "英国",
        "ranking": 153,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "罗素集团成员，商学院和环境科学领域优秀。"
    },
    {
        "name": "Queen's University Belfast",
        "name_cn": "贝尔法斯特女王大学",
        "country": "英国",
        "ranking": 233,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "北爱尔兰顶尖大学，药学和食品科学领域著名。"
    },
    {
        "name": "Durham University",
        "name_cn": "杜伦大学",
        "country": "英国",
        "ranking": 78,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-01-31",
        "description": "英格兰第三古老大学，采用学院制，人文社科领域卓越。"
    },
    {
        "name": "University of St Andrews",
        "name_cn": "圣安德鲁斯大学",
        "country": "英国",
        "ranking": 95,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 92, "ielts": 7.0},
        "application_deadline": "2025-03-31",
        "description": "苏格兰第一所大学，威廉王子母校，人文社科领域优秀。"
    },
    {
        "name": "Lancaster University",
        "name_cn": "兰卡斯特大学",
        "country": "英国",
        "ranking": 141,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 93, "ielts": 6.5},
        "application_deadline": "2025-08-01",
        "description": "管理学院获得三重认证，商科领域尤为突出。"
    },
    {
        "name": "University of Bath",
        "name_cn": "巴斯大学",
        "country": "英国",
        "ranking": 148,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-07-01",
        "description": "翻译和建筑学领域著名，校园环境优美。"
    },
    {
        "name": "Loughborough University",
        "name_cn": "拉夫堡大学",
        "country": "英国",
        "ranking": 212,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "体育科学和工程领域领先，拥有顶级体育设施。"
    },
    {
        "name": "University of Surrey",
        "name_cn": "萨里大学",
        "country": "英国",
        "ranking": 244,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "酒店管理和航天工程领域著名，就业率高。"
    },
    {
        "name": "University of Reading",
        "name_cn": "雷丁大学",
        "country": "英国",
        "ranking": 169,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "气象学和农业科学领域领先，亨利商学院著名。"
    },
    {
        "name": "University of Sussex",
        "name_cn": "萨塞克斯大学",
        "country": "英国",
        "ranking": 218,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-08-01",
        "description": "发展研究学全球领先，校园位于南唐斯国家公园。"
    },
    {
        "name": "Royal Holloway, University of London",
        "name_cn": "伦敦大学皇家霍洛威学院",
        "country": "英国",
        "ranking": 402,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "伦敦大学成员，信息安全和音乐领域著名。"
    },
    {
        "name": "University of Leicester",
        "name_cn": "莱斯特大学",
        "country": "英国",
        "ranking": 272,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "博物馆学和遗传学领域领先，DNA指纹识别技术发源地。"
    },
    {
        "name": "University of East Anglia",
        "name_cn": "东英吉利大学",
        "country": "英国",
        "ranking": 295,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "创意写作和环境科学领域著名，校园环境优美。"
    },
    {
        "name": "University of Aberdeen",
        "name_cn": "阿伯丁大学",
        "country": "英国",
        "ranking": 208,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "苏格兰第五古老大学，石油工程和医学领域著名。"
    },
    {
        "name": "University of Dundee",
        "name_cn": "邓迪大学",
        "country": "英国",
        "ranking": 441,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "艺术设计和生命科学领域领先，游戏设计专业著名。"
    },
    {
        "name": "Heriot-Watt University",
        "name_cn": "赫瑞-瓦特大学",
        "country": "英国",
        "ranking": 235,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "石油工程和精算科学领域全球领先。"
    },
    {
        "name": "University of Strathclyde",
        "name_cn": "思克莱德大学",
        "country": "英国",
        "ranking": 281,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "苏格兰第三大大学，药学和工程领域优秀。"
    },
    {
        "name": "Swansea University",
        "name_cn": "斯旺西大学",
        "country": "英国",
        "ranking": 298,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "工程学和医学领域领先，校园位于海滨。"
    },
    {
        "name": "City, University of London",
        "name_cn": "伦敦大学城市学院",
        "country": "英国",
        "ranking": 343,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "贝叶斯商学院（原卡斯商学院）所在地，金融专业著名。"
    },
    {
        "name": "Brunel University London",
        "name_cn": "布鲁内尔大学",
        "country": "英国",
        "ranking": 342,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "工程和设计领域领先，位于伦敦西部。"
    },
    {
        "name": "University of Kent",
        "name_cn": "肯特大学",
        "country": "英国",
        "ranking": 336,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "法律和国际关系领域著名，拥有欧洲研究中心。"
    },
    {
        "name": "Oxford Brookes University",
        "name_cn": "牛津布鲁克斯大学",
        "country": "英国",
        "ranking": 413,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "建筑学和酒店管理领域著名，与牛津大学相邻。"
    },
    {
        "name": "University of Essex",
        "name_cn": "埃塞克斯大学",
        "country": "英国",
        "ranking": 459,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "社会学和经济学领域领先，拥有独立研究精神。"
    },
    {
        "name": "Goldsmiths, University of London",
        "name_cn": "伦敦大学金史密斯学院",
        "country": "英国",
        "ranking": 583,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "艺术设计和传媒领域全球著名，培养众多艺术家。"
    },
    {
        "name": "Birkbeck, University of London",
        "name_cn": "伦敦大学伯贝克学院",
        "country": "英国",
        "ranking": 343,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "以夜间授课著称，适合在职人士，研究实力强。"
    },
    {
        "name": "SOAS University of London",
        "name_cn": "伦敦大学亚非学院",
        "country": "英国",
        "ranking": 443,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-07-01",
        "description": "亚洲、非洲和中东研究领域全球顶尖。"
    },
    {
        "name": "Aston University",
        "name_cn": "阿斯顿大学",
        "country": "英国",
        "ranking": 446,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 92, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "商学院获得三重认证，就业率高，位于伯明翰市中心。"
    },
    {
        "name": "Coventry University",
        "name_cn": "考文垂大学",
        "country": "英国",
        "ranking": 531,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "汽车工程和护理学领域著名，注重实践教学。"
    },
    {
        "name": "University of Plymouth",
        "name_cn": "普利茅斯大学",
        "country": "英国",
        "ranking": 561,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "海洋科学和航海领域领先，位于海滨城市。"
    },
    {
        "name": "University of Westminster",
        "name_cn": "威斯敏斯特大学",
        "country": "英国",
        "ranking": 741,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "传媒和艺术设计领域著名，位于伦敦市中心。"
    },
    {
        "name": "University of Brighton",
        "name_cn": "布莱顿大学",
        "country": "英国",
        "ranking": 751,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "艺术设计和体育科学领域著名，位于海滨城市。"
    },
    {
        "name": "University of Hull",
        "name_cn": "赫尔大学",
        "country": "英国",
        "ranking": 523,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "化学和计算机科学领域著名，液晶技术发源地。"
    },
    {
        "name": "Keele University",
        "name_cn": "基尔大学",
        "country": "英国",
        "ranking": 781,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "医学和环境科学领域著名，校园位于乡村庄园。"
    },
    {
        "name": "University of Stirling",
        "name_cn": "斯特灵大学",
        "country": "英国",
        "ranking": 452,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "体育科学和传媒领域领先，校园风景优美。"
    },
    {
        "name": "University of Portsmouth",
        "name_cn": "朴茨茅斯大学",
        "country": "英国",
        "ranking": 502,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "药学和犯罪学领域著名，位于海滨城市。"
    },

    # ==================== 美国 (30 所) ====================
    {
        "name": "Massachusetts Institute of Technology",
        "name_cn": "麻省理工学院",
        "country": "美国",
        "ranking": 1,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-05",
        "description": "全球顶尖理工科大学，工程和计算机科学领域无可匹敌。"
    },
    {
        "name": "Stanford University",
        "name_cn": "斯坦福大学",
        "country": "美国",
        "ranking": 3,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "硅谷心脏地带，创业精神和计算机科学领域全球领先。"
    },
    {
        "name": "Harvard University",
        "name_cn": "哈佛大学",
        "country": "美国",
        "ranking": 4,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.5},
        "application_deadline": "2025-01-01",
        "description": "美国最古老大学，法学、商学和医学领域全球顶尖。"
    },
    {
        "name": "California Institute of Technology",
        "name_cn": "加州理工学院",
        "country": "美国",
        "ranking": 15,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-03",
        "description": "规模极小但研究实力极强，物理和工程领域顶尖。"
    },
    {
        "name": "University of Chicago",
        "name_cn": "芝加哥大学",
        "country": "美国",
        "ranking": 11,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 104, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "经济学和法学领域全球顶尖，学术氛围浓厚。"
    },
    {
        "name": "Princeton University",
        "name_cn": "普林斯顿大学",
        "country": "美国",
        "ranking": 16,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-01",
        "description": "本科教育全美第一，数学和物理领域卓越。"
    },
    {
        "name": "Columbia University",
        "name_cn": "哥伦比亚大学",
        "country": "美国",
        "ranking": 23,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 100, "ielts": 7.5},
        "application_deadline": "2025-01-01",
        "description": "位于纽约市中心，新闻学和商学领域全球著名。"
    },
    {
        "name": "University of Pennsylvania",
        "name_cn": "宾夕法尼亚大学",
        "country": "美国",
        "ranking": 12,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-05",
        "description": "沃顿商学院全球顶尖，跨学科教育领先。"
    },
    {
        "name": "Yale University",
        "name_cn": "耶鲁大学",
        "country": "美国",
        "ranking": 18,
        "gpa_requirement": {"min": 3.8, "preferred": 4.0},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "法学、艺术和人文社科领域全球顶尖。"
    },
    {
        "name": "Cornell University",
        "name_cn": "康奈尔大学",
        "country": "美国",
        "ranking": 20,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "常春藤盟校中规模最大，工程和酒店管理领域著名。"
    },
    {
        "name": "University of Michigan",
        "name_cn": "密歇根大学安娜堡分校",
        "country": "美国",
        "ranking": 33,
        "gpa_requirement": {"min": 3.4, "preferred": 3.7},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-02-01",
        "description": "美国顶尖公立大学，工程和商学领域实力强劲。"
    },
    {
        "name": "Johns Hopkins University",
        "name_cn": "约翰霍普金斯大学",
        "country": "美国",
        "ranking": 28,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-03",
        "description": "医学和公共卫生领域全球第一，研究经费全美最高。"
    },
    {
        "name": "Northwestern University",
        "name_cn": "西北大学",
        "country": "美国",
        "ranking": 47,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "新闻学和材料科学领域全球顶尖，位于芝加哥郊区。"
    },
    {
        "name": "University of California, Berkeley",
        "name_cn": "加州大学伯克利分校",
        "country": "美国",
        "ranking": 10,
        "gpa_requirement": {"min": 3.5, "preferred": 3.8},
        "language_requirement": {"toefl": 90, "ielts": 7.0},
        "application_deadline": "2025-12-01",
        "description": "全球公立大学第一，计算机科学和工程领域顶尖。"
    },
    {
        "name": "University of California, Los Angeles",
        "name_cn": "加州大学洛杉矶分校",
        "country": "美国",
        "ranking": 29,
        "gpa_requirement": {"min": 3.5, "preferred": 3.8},
        "language_requirement": {"toefl": 87, "ielts": 7.0},
        "application_deadline": "2025-12-01",
        "description": "美国申请人数最多的大学，电影和医学领域著名。"
    },
    {
        "name": "Carnegie Mellon University",
        "name_cn": "卡内基梅隆大学",
        "country": "美国",
        "ranking": 51,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 102, "ielts": 7.5},
        "application_deadline": "2025-01-01",
        "description": "计算机科学和人工智能领域全球顶尖，艺术与科技融合。"
    },
    {
        "name": "Duke University",
        "name_cn": "杜克大学",
        "country": "美国",
        "ranking": 26,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "南方哈佛，公共政策和生物工程领域著名。"
    },
    {
        "name": "University of Washington",
        "name_cn": "华盛顿大学",
        "country": "美国",
        "ranking": 63,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 92, "ielts": 7.0},
        "application_deadline": "2025-12-01",
        "description": "计算机科学和医学领域顶尖，位于西雅图科技中心。"
    },
    {
        "name": "New York University",
        "name_cn": "纽约大学",
        "country": "美国",
        "ranking": 38,
        "gpa_requirement": {"min": 3.5, "preferred": 3.7},
        "language_requirement": {"toefl": 100, "ielts": 7.5},
        "application_deadline": "2025-01-05",
        "description": "位于纽约市中心，电影、商学和法学领域全球著名。"
    },
    {
        "name": "University of Illinois Urbana-Champaign",
        "name_cn": "伊利诺伊大学厄巴纳-香槟分校",
        "country": "美国",
        "ranking": 64,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 102, "ielts": 6.5},
        "application_deadline": "2025-12-15",
        "description": "工程、计算机科学和图书馆学领域全球顶尖。"
    },
    {
        "name": "Georgia Institute of Technology",
        "name_cn": "佐治亚理工学院",
        "country": "美国",
        "ranking": 97,
        "gpa_requirement": {"min": 3.4, "preferred": 3.7},
        "language_requirement": {"toefl": 90, "ielts": 7.0},
        "application_deadline": "2025-01-01",
        "description": "美国顶尖理工科大学，工程和计算机科学领域实力强劲。"
    },
    {
        "name": "University of Texas at Austin",
        "name_cn": "德克萨斯大学奥斯汀分校",
        "country": "美国",
        "ranking": 58,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-12-01",
        "description": "美国顶尖公立大学，石油工程和会计领域顶尖。"
    },
    {
        "name": "University of Wisconsin-Madison",
        "name_cn": "威斯康星大学麦迪逊分校",
        "country": "美国",
        "ranking": 102,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 92, "ielts": 7.0},
        "application_deadline": "2025-12-01",
        "description": "公立常春藤，生命科学和教育学领域著名。"
    },
    {
        "name": "University of Southern California",
        "name_cn": "南加州大学",
        "country": "美国",
        "ranking": 125,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-15",
        "description": "位于洛杉矶，电影、工程和商学领域著名，校友网络强大。"
    },
    {
        "name": "University of North Carolina at Chapel Hill",
        "name_cn": "北卡罗来纳大学教堂山分校",
        "country": "美国",
        "ranking": 132,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 90, "ielts": 7.0},
        "application_deadline": "2025-01-15",
        "description": "公立常春藤，新闻学和公共卫生领域顶尖。"
    },
    {
        "name": "Boston University",
        "name_cn": "波士顿大学",
        "country": "美国",
        "ranking": 93,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 90, "ielts": 7.0},
        "application_deadline": "2025-01-06",
        "description": "位于波士顿市中心，传媒和医学领域著名。"
    },
    {
        "name": "University of California, San Diego",
        "name_cn": "加州大学圣地亚哥分校",
        "country": "美国",
        "ranking": 62,
        "gpa_requirement": {"min": 3.3, "preferred": 3.6},
        "language_requirement": {"toefl": 83, "ielts": 7.0},
        "application_deadline": "2025-12-01",
        "description": "生物医学和海洋科学领域顶尖，校园位于海边。"
    },
    {
        "name": "Brown University",
        "name_cn": "布朗大学",
        "country": "美国",
        "ranking": 56,
        "gpa_requirement": {"min": 3.7, "preferred": 3.9},
        "language_requirement": {"toefl": 100, "ielts": 8.0},
        "application_deadline": "2025-01-05",
        "description": "常春藤盟校，开放课程体系，本科教育优秀。"
    },
    {
        "name": "Dartmouth College",
        "name_cn": "达特茅斯学院",
        "country": "美国",
        "ranking": 237,
        "gpa_requirement": {"min": 3.6, "preferred": 3.8},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-02",
        "description": "常春藤盟校，本科教育优秀，塔克商学院著名。"
    },
    {
        "name": "Vanderbilt University",
        "name_cn": "范德堡大学",
        "country": "美国",
        "ranking": 78,
        "gpa_requirement": {"min": 3.5, "preferred": 3.7},
        "language_requirement": {"toefl": 100, "ielts": 7.0},
        "application_deadline": "2025-01-01",
        "description": "南方哈佛，教育学和医学领域顶尖，校园环境优美。"
    },

    # ==================== 澳大利亚 (20 所) ====================
    {
        "name": "University of Melbourne",
        "name_cn": "墨尔本大学",
        "country": "澳大利亚",
        "ranking": 14,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 94, "ielts": 7.0},
        "application_deadline": "2025-10-31",
        "description": "澳大利亚排名第一，法学和医学领域顶尖。"
    },
    {
        "name": "Australian National University",
        "name_cn": "澳大利亚国立大学",
        "country": "澳大利亚",
        "ranking": 34,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 88, "ielts": 6.5},
        "application_deadline": "2025-05-15",
        "description": "澳大利亚唯一国立大学，政治学和计算机科学领域领先。"
    },
    {
        "name": "University of Sydney",
        "name_cn": "悉尼大学",
        "country": "澳大利亚",
        "ranking": 19,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 96, "ielts": 7.0},
        "application_deadline": "2025-06-30",
        "description": "澳大利亚历史最悠久大学，医学和法学领域著名。"
    },
    {
        "name": "University of New South Wales",
        "name_cn": "新南威尔士大学",
        "country": "澳大利亚",
        "ranking": 19,
        "gpa_requirement": {"min": 3.2, "preferred": 3.5},
        "language_requirement": {"toefl": 90, "ielts": 6.5},
        "application_deadline": "2025-07-31",
        "description": "工程和商科领域顶尖，就业率高。"
    },
    {
        "name": "University of Queensland",
        "name_cn": "昆士兰大学",
        "country": "澳大利亚",
        "ranking": 43,
        "gpa_requirement": {"min": 3.0, "preferred": 3.4},
        "language_requirement": {"toefl": 87, "ielts": 6.5},
        "application_deadline": "2025-05-31",
        "description": "生物科学和环境科学领域领先，HPV疫苗研发地。"
    },
    {
        "name": "Monash University",
        "name_cn": "莫纳什大学",
        "country": "澳大利亚",
        "ranking": 37,
        "gpa_requirement": {"min": 3.0, "preferred": 3.4},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "药学和教育学领域顶尖，澳大利亚规模最大的大学。"
    },
    {
        "name": "University of Western Australia",
        "name_cn": "西澳大学",
        "country": "澳大利亚",
        "ranking": 77,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 82, "ielts": 6.5},
        "application_deadline": "2025-07-01",
        "description": "矿业工程和海洋科学领域领先，位于珀斯。"
    },
    {
        "name": "University of Adelaide",
        "name_cn": "阿德莱德大学",
        "country": "澳大利亚",
        "ranking": 82,
        "gpa_requirement": {"min": 3.0, "preferred": 3.3},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "葡萄酒酿造和石油工程领域著名，五位诺贝尔奖得主。"
    },
    {
        "name": "University of Technology Sydney",
        "name_cn": "悉尼科技大学",
        "country": "澳大利亚",
        "ranking": 88,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-04-30",
        "description": "年轻大学中的佼佼者，设计和信息技术领域领先。"
    },
    {
        "name": "University of Newcastle",
        "name_cn": "纽卡斯尔大学（澳洲）",
        "country": "澳大利亚",
        "ranking": 173,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "医学和工程领域著名，位于新南威尔士州。"
    },
    {
        "name": "Macquarie University",
        "name_cn": "麦考瑞大学",
        "country": "澳大利亚",
        "ranking": 130,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 83, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "会计和金融领域著名，位于悉尼北部。"
    },
    {
        "name": "Queensland University of Technology",
        "name_cn": "昆士兰科技大学",
        "country": "澳大利亚",
        "ranking": 189,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-05-31",
        "description": "传媒和创意产业领域领先，位于布里斯班市中心。"
    },
    {
        "name": "Royal Melbourne Institute of Technology",
        "name_cn": "皇家墨尔本理工大学",
        "country": "澳大利亚",
        "ranking": 140,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-05-31",
        "description": "艺术设计和建筑领域全球著名，实践教学导向。"
    },
    {
        "name": "Curtin University",
        "name_cn": "科廷大学",
        "country": "澳大利亚",
        "ranking": 174,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "矿业工程和地球科学领域全球领先，位于珀斯。"
    },
    {
        "name": "University of Wollongong",
        "name_cn": "伍伦贡大学",
        "country": "澳大利亚",
        "ranking": 167,
        "gpa_requirement": {"min": 2.8, "preferred": 3.2},
        "language_requirement": {"toefl": 86, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "信息技术和工程领域著名，位于悉尼南部海滨。"
    },
    {
        "name": "Griffith University",
        "name_cn": "格里菲斯大学",
        "country": "澳大利亚",
        "ranking": 255,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-05-31",
        "description": "酒店管理、音乐和犯罪学领域著名，位于黄金海岸。"
    },
    {
        "name": "Deakin University",
        "name_cn": "迪肯大学",
        "country": "澳大利亚",
        "ranking": 197,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "体育管理和教育学领域领先，位于墨尔本。"
    },
    {
        "name": "University of Tasmania",
        "name_cn": "塔斯马尼亚大学",
        "country": "澳大利亚",
        "ranking": 307,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 80, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "海洋科学和南极研究领域全球领先，位于塔斯马尼亚岛。"
    },
    {
        "name": "Swinburne University of Technology",
        "name_cn": "斯威本科技大学",
        "country": "澳大利亚",
        "ranking": 285,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-05-31",
        "description": "天文学和设计领域著名，拥有先进的天文观测设施。"
    },
    {
        "name": "La Trobe University",
        "name_cn": "乐卓博大学",
        "country": "澳大利亚",
        "ranking": 217,
        "gpa_requirement": {"min": 2.8, "preferred": 3.0},
        "language_requirement": {"toefl": 79, "ielts": 6.5},
        "application_deadline": "2025-06-30",
        "description": "生物医学和农业科学领域领先，位于墨尔本。"
    }
]

# 为每所学校随机分配 15-25 个专业
import random
random.seed(42)

for school in SCHOOLS:
    num_majors = random.randint(15, 25)
    school["majors"] = random.sample(MAJORS, num_majors)


def seed_database():
    from app import create_app
    from app.models.school import School
    from app.extensions import db
    from datetime import datetime

    app = create_app()
    with app.app_context():
        if School.query.count() == 0:
            for school_data in SCHOOLS:
                school = School(
                    name=school_data['name'],
                    name_cn=school_data.get('name_cn'),
                    country=school_data['country'],
                    ranking=school_data['ranking'],
                    majors=school_data['majors'],
                    gpa_requirement=school_data['gpa_requirement'],
                    language_requirement=school_data['language_requirement'],
                    application_deadline=datetime.strptime(
                        school_data['application_deadline'], '%Y-%m-%d'
                    ).date(),
                    description=school_data['description'],
                )
                db.session.add(school)
            db.session.commit()
            print(f"Seeded {len(SCHOOLS)} schools")
        else:
            print(f"Schools already exist, skipping seed")


if __name__ == "__main__":
    seed_database()
