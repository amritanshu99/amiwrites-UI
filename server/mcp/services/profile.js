const portfolio = require("../../../src/data/publicPortfolio.json");
const { SITE_URL } = require("../config");

const categories = {
  JavaScript: ["Frontend", "Backend"], React: ["Frontend"],
  "Node.js": ["Backend"], Express: ["Backend"], MongoDB: ["Backend"],
  GraphQL: ["Backend"], AI: ["AI"], ML: ["AI"],
};

function getSkills(category) {
  return portfolio.skills.map(({ skill, expertise }) => ({
    name: skill, expertise, categories: categories[skill] || [],
  })).filter((skill) => !category || skill.categories.some((item) => item.toLowerCase() === category.toLowerCase()));
}

function getProfile() {
  // Deliberate public-field allowlist: no contact details or personal photos.
  return {
    name: portfolio.name, title: portfolio.title, summary: portfolio.description,
    url: SITE_URL + "/", skills: getSkills(),
    experience: portfolio.experience.map(({ company, roles }) => ({
      company, roles: roles.map(({ title, startDate, endDate }) => ({ title, startDate, endDate })),
    })),
    links: { github: portfolio.socialLinks.github, linkedin: portfolio.socialLinks.linkedin },
  };
}

module.exports = { getProfile, getSkills };
