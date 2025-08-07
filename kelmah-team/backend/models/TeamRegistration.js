const { pool } = require('../config/database');

class TeamRegistration {
  constructor(data) {
    this.id = data.id;
    this.personalInfo = typeof data.personal_info === 'string' 
      ? JSON.parse(data.personal_info) 
      : data.personal_info;
    this.technicalBackground = typeof data.technical_background === 'string' 
      ? JSON.parse(data.technical_background) 
      : data.technical_background;
    this.commitment = typeof data.commitment === 'string' 
      ? JSON.parse(data.commitment) 
      : data.commitment;
    this.paymentStatus = data.payment_status;
    this.applicantScore = data.applicant_score;
    this.isSelected = data.is_selected;
    this.selectionRank = data.selection_rank;
    this.registrationDate = data.registration_date;
    this.updatedAt = data.updated_at;
    this.email = data.email;
    this.status = data.status;
  }

  // Create a new team registration
  static async create(registrationData) {
    try {
      // Extract email from personal info
      const email = registrationData.fullName ? registrationData.email : registrationData.personalInfo?.email;
      
      // If we have the old flat structure, convert it
      const personalInfo = registrationData.fullName ? {
        fullName: registrationData.fullName,
        email: registrationData.email,
        phone: registrationData.phone,
        age: registrationData.age,
        location: registrationData.location,
        education: registrationData.education,
        currentStatus: registrationData.currentStatus
      } : registrationData.personalInfo;

      const technicalBackground = registrationData.programmingLanguages ? {
        programmingLanguages: registrationData.programmingLanguages,
        frameworks: registrationData.frameworks,
        experienceLevel: registrationData.experienceLevel,
        portfolioUrl: registrationData.portfolioUrl,
        githubUrl: registrationData.githubUrl,
        previousProjects: registrationData.previousProjects,
        hasWebDevelopmentExperience: registrationData.hasWebDevelopmentExperience,
        hasAIExperience: registrationData.hasAIExperience
      } : registrationData.technicalBackground;

      const commitment = registrationData.availableHours ? {
        availableHours: registrationData.availableHours,
        startDate: registrationData.startDate,
        motivationLetter: registrationData.motivationLetter,
        careerGoals: registrationData.careerGoals,
        whyKelmah: registrationData.whyKelmah,
        canRelocate: registrationData.canRelocate,
        hasTransportation: registrationData.hasTransportation
      } : registrationData.commitment;

      const score = this.calculateApplicantScore({ personalInfo, technicalBackground, commitment });
      
      const query = `
        INSERT INTO team_registrations 
        (personal_info, technical_background, commitment, email, applicant_score)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        JSON.stringify(personalInfo),
        JSON.stringify(technicalBackground),
        JSON.stringify(commitment),
        email.toLowerCase(),
        score
      ];

      const result = await pool.query(query, values);
      return new TeamRegistration(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already registered');
      }
      console.error('Database error:', error);
      throw error;
    }
  }

  // Find registration by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM team_registrations WHERE email = $1';
      const result = await pool.query(query, [email.toLowerCase()]);
      
      return result.rows.length > 0 ? new TeamRegistration(result.rows[0]) : null;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Find registration by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM team_registrations WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      return result.rows.length > 0 ? new TeamRegistration(result.rows[0]) : null;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get all registrations with pagination
  static async find(query = {}, options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const offset = (page - 1) * limit;
      
      let sqlQuery = 'SELECT * FROM team_registrations';
      let whereConditions = [];
      let values = [];
      let paramCount = 0;

      // Add WHERE conditions based on query
      if (query.paymentStatus) {
        whereConditions.push(`payment_status = $${++paramCount}`);
        values.push(query.paymentStatus);
      }
      
      if (query.isSelected !== undefined) {
        whereConditions.push(`is_selected = $${++paramCount}`);
        values.push(query.isSelected);
      }

      if (whereConditions.length > 0) {
        sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
      }

      sqlQuery += ` ORDER BY registration_date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      values.push(limit, offset);
      
      const result = await pool.query(sqlQuery, values);
      return result.rows.map(row => new TeamRegistration(row));
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get top candidates for selection
  static async getTopCandidates(limit = 10) {
    try {
      const query = `
        SELECT * FROM team_registrations 
        WHERE payment_status = 'paid' AND status = 'active'
        ORDER BY applicant_score DESC, registration_date ASC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows.map(row => new TeamRegistration(row));
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Count documents (for pagination)
  static async countDocuments(query = {}) {
    try {
      let sqlQuery = 'SELECT COUNT(*) FROM team_registrations';
      let whereConditions = [];
      let values = [];
      let paramCount = 0;

      if (query.paymentStatus) {
        whereConditions.push(`payment_status = $${++paramCount}`);
        values.push(query.paymentStatus);
      }

      if (whereConditions.length > 0) {
        sqlQuery += ' WHERE ' + whereConditions.join(' AND ');
      }

      const result = await pool.query(sqlQuery, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(status) {
    try {
      const query = `
        UPDATE team_registrations 
        SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, this.id]);
      return new TeamRegistration(result.rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Update selection status
  async updateSelection(isSelected, rank = null) {
    try {
      const query = `
        UPDATE team_registrations 
        SET is_selected = $1, selection_rank = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [isSelected, rank, this.id]);
      return new TeamRegistration(result.rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Get registration statistics
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_applications,
          COUNT(CASE WHEN is_selected = true THEN 1 END) as selected_candidates,
          AVG(applicant_score) as avg_score,
          MAX(applicant_score) as highest_score
        FROM team_registrations
        WHERE status = 'active' OR status IS NULL
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];
      return {
        totalApplications: parseInt(stats.total_applications),
        paidApplications: parseInt(stats.paid_applications),
        selectedCandidates: parseInt(stats.selected_candidates),
        avgScore: parseFloat(stats.avg_score) || 0,
        highestScore: parseInt(stats.highest_score) || 0
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  // Calculate applicant score
  static calculateApplicantScore(applicant) {
    let score = 0;

    // Technical score (40 points)
    const techBg = applicant.technicalBackground || {};
    if (techBg.experienceLevel === 'expert') score += 15;
    else if (techBg.experienceLevel === 'advanced') score += 12;
    else if (techBg.experienceLevel === 'intermediate') score += 8;
    else score += 4;

    score += Math.min((techBg.programmingLanguages?.length || 0) * 2, 10);
    score += Math.min((techBg.frameworks?.length || 0) * 1.5, 8);
    if (techBg.hasWebDevelopmentExperience) score += 4;
    if (techBg.hasAIExperience) score += 3;

    // Commitment score (30 points)
    const commitment = applicant.commitment || {};
    score += Math.min((commitment.availableHours || 0) / 2, 15);
    if ((commitment.motivationLetter?.length || 0) > 300) score += 5;
    if (commitment.canRelocate) score += 3;
    if (commitment.hasTransportation) score += 2;
    if ((commitment.whyKelmah?.length || 0) > 100) score += 5;

    // Experience score (20 points)
    const personal = applicant.personalInfo || {};
    const age = personal.age || 0;
    if (age >= 20 && age <= 30) score += 5;
    if (personal.currentStatus === 'employed') score += 4;
    else if (personal.currentStatus === 'freelancer') score += 3;
    else if (personal.currentStatus === 'student') score += 2;

    if (techBg.portfolioUrl) score += 4;
    if (techBg.githubUrl) score += 3;
    score += Math.min((techBg.previousProjects?.length || 0) * 2, 4);

    // Education score (10 points)
    const education = (personal.education || '').toLowerCase();
    if (education.includes('computer') || education.includes('software') || 
        education.includes('engineering')) score += 6;
    else if (education.includes('science') || education.includes('technology')) score += 4;
    else score += 2;

    return Math.min(Math.round(score), 100);
  }

  // Convert to JSON (Mongoose compatibility)
  toJSON() {
    return {
      _id: this.id,
      id: this.id,
      personalInfo: this.personalInfo,
      technicalBackground: this.technicalBackground,
      commitment: this.commitment,
      paymentStatus: this.paymentStatus,
      applicantScore: this.applicantScore,
      isSelected: this.isSelected,
      selectionRank: this.selectionRank,
      registrationDate: this.registrationDate,
      updatedAt: this.updatedAt,
      email: this.email,
      status: this.status
    };
  }

  // For backward compatibility with Mongoose
  save() {
    return this;
  }
}

module.exports = TeamRegistration;