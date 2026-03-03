---
title: about
layout: about
---

这里写关于页的正文，支持 Markdown, HTML

<div class="about-container">
  <div class="header-section">
    <h1>欢迎来到我的博客</h1>
    <p class="subtitle">分享技术、记录成长、探索无限可能</p>
  </div>

  <div class="intro-section">
    <div class="profile-card">
      <div class="avatar">
        <img src="/img/avatar.png" alt="头像" />
      </div>
      <div class="info">
        <h2>关于我</h2>
        <p>我是一名热爱技术的开发者，专注于AI机器学习、后端开发和测试开发。在这里，我会分享我的技术心得、项目经验以及对人工智能和软件开发的思考。</p>
      </div>
    </div>
  </div>

  <div class="skills-section">
    <h2>技术栈</h2>
    <div class="skills-grid">
      <div class="skill-item">
        <h3>AI机器学习</h3>
        <ul>
          <li>Python / TensorFlow</li>
          <li>PyTorch / Keras</li>
          <li>Scikit-learn / Pandas</li>
          <li>Computer Vision / NLP</li>
          <li>Deep Learning / Neural Networks</li>
        </ul>
      </div>
      <div class="skill-item">
        <h3>后端开发</h3>
        <ul>
          <li>Python / FastAPI</li>
          <li>Java / Spring Boot</li>
          <li>Go / Gin</li>
          <li>MySQL / PostgreSQL</li>
          <li>Redis / MongoDB</li>
        </ul>
      </div>
      <div class="skill-item">
        <h3>测试开发</h3>
        <ul>
          <li>Pytest / Unittest</li>
          <li>Selenium / Playwright</li>
          <li>JMeter / Locust</li>
          <li>CI/CD / Jenkins</li>
          <li>Docker / Kubernetes</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="blog-section">
    <h2>博客内容</h2>
    <div class="content-categories">
      <div class="category-card">
        <h3>算法与数据结构</h3>
        <p>分享算法学习心得，数据结构实现，以及刷题经验总结</p>
      </div>
      <div class="category-card">
        <h3>技术文章</h3>
        <p>记录开发过程中遇到的问题与解决方案，分享最佳实践</p>
      </div>
      <div class="category-card">
        <h3>项目经验</h3>
        <p>展示个人项目，分享项目开发过程中的技术选型与架构设计</p>
      </div>
    </div>
  </div>

  <div class="contact-section">
    <h2>联系方式</h2>
    <div class="contact-info">
      <div class="contact-item">
        <strong>Email:</strong> <a href="mailto:407827808@qq.com">407827808@qq.com</a>
      </div>
      <div class="contact-item">
        <strong>GitHub:</strong> <a href="https://github.com/Andy115951" target="_blank">@Andy115951</a>
      </div>
      <div class="social-links">
        <a href="#" class="social-link">微博</a>
        <a href="#" class="social-link">知乎</a>
        <a href="#" class="social-link">掘金</a>
      </div>
    </div>
  </div>

  <div class="footer-section">
    <p>感谢您的访问！如果您对我的文章有任何建议或想法，欢迎与我交流。</p>
    <p class="motto">"代码改变世界，学习成就未来"</p>
  </div>
</div>

<style>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', 'Microsoft YaHei', sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.header-section h1 {
  color: #2c3e50;
  font-size: 2.5em;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.2em;
  font-style: italic;
}

.profile-card {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 40px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.avatar {
  margin-right: 30px;
}

.avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #3498db;
}

.info h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.skills-section {
  margin-bottom: 40px;
}

.skills-section h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.skill-item {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #3498db;
}

.skill-item h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.skill-item ul {
  list-style: none;
  padding: 0;
}

.skill-item li {
  padding: 5px 0;
  color: #555;
}

.skill-item li:before {
  content: "▸ ";
  color: #3498db;
  font-weight: bold;
}

.blog-section {
  margin-bottom: 40px;
}

.blog-section h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.content-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.category-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
}

.category-card h3 {
  margin-bottom: 15px;
}

.contact-section {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.contact-section h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 20px;
}

.contact-info {
  text-align: center;
}

.contact-item {
  margin-bottom: 10px;
  color: #555;
}

.contact-item a {
  color: #3498db;
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

.social-links {
  margin-top: 20px;
}

.social-link {
  display: inline-block;
  margin: 0 10px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background 0.3s;
}

.social-link:hover {
  background: #2980b9;
}

.footer-section {
  text-align: center;
  color: #7f8c8d;
}

.motto {
  font-style: italic;
  font-weight: bold;
  color: #3498db;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar {
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .skills-grid, .content-categories {
    grid-template-columns: 1fr;
  }
}
</style>