const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config(); // Load .env file

let app;
let mongoServer;
let adminToken;
let citizenToken;
let officerToken;
let testUser;
let testOfficer;
let testAdmin;
let Issue;
let User;

// Increase timeout for MongoDB Memory Server initialization
jest.setTimeout(10000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'testjwtsecret';

  // Now load the app and models after setting env vars
  app = require('../server');
  Issue = require('../../shared/models/Issue');
  User = require('../../shared/models/User');

  // Wait a bit for mongoose to connect
  await new Promise(resolve => setTimeout(resolve, 1000));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear collections
  await Issue.deleteMany({});
  await User.deleteMany({});
});

describe('Issue Endpoints', () => {
  describe('POST /api/issues/create', () => {
    it('should create an issue with valid data', async () => {
      const issueData = {
        category: 'road_damage',
        description: 'Large pothole on main street',
        latitude: '22.7196',
        longitude: '75.8577',
        address: 'Bhawarkua, Indore'
      };

      const response = await request(app)
        .post('/api/issues/create')
        .set('Authorization', `Bearer ${citizenToken}`)
        .field('category', issueData.category)
        .field('description', issueData.description)
        .field('latitude', issueData.latitude)
        .field('longitude', issueData.longitude)
        .field('address', issueData.address);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Issue reported successfully');
      expect(response.body.issue).toHaveProperty('_id');
      expect(response.body.issue.category).toBe(issueData.category);
      expect(response.body.issue.description).toBe(issueData.description);
      expect(response.body.issue.location.coordinates).toEqual([
        parseFloat(issueData.longitude),
        parseFloat(issueData.latitude)
      ]);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/issues/create')
        .set('Authorization', `Bearer ${citizenToken}`)
        .field('category', 'road_damage')
        .field('description', 'Test description')
        // Missing latitude and longitude
      ;

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('category, description, latitude, longitude are required');
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .post('/api/issues/create')
        .set('Authorization', `Bearer ${citizenToken}`)
        .field('category', 'invalid_category')
        .field('description', 'Test description')
        .field('latitude', '22.7196')
        .field('longitude', '75.8577')
      ;

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/issues/myIssues', () => {
    it("should return user's issues with pagination", async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      // Create test issues
      await Issue.create([
        {
          category: 'road_damage',
          description: 'Issue 1',
          location: { type: 'Point', coordinates: [75.8577, 22.7196] },
          reporter: testUser._id,
          priorityScore: 0.5,
          priority: 'Medium'
        },
        {
          category: 'garbage',
          description: 'Issue 2',
          location: { type: 'Point', coordinates: [75.8580, 22.7200] },
          reporter: testUser._id,
          priorityScore: 0.3,
          priority: 'Low'
        }
      ]);

      const response = await request(app)
        .get('/api/issues/myIssues')
        .set('Authorization', `Bearer ${citizenToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.count).toBe(2);
    });

    it('should filter by status', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      // Create test issues with different statuses
      await Issue.create([
        {
          category: 'road_damage',
          description: 'Submitted issue',
          location: { type: 'Point', coordinates: [75.8577, 22.7196] },
          reporter: testUser._id,
          priorityScore: 0.5,
          priority: 'Medium',
          status: 'Submitted'
        },
        {
          category: 'garbage',
          description: 'Resolved issue',
          location: { type: 'Point', coordinates: [75.8580, 22.7200] },
          reporter: testUser._id,
          priorityScore: 0.3,
          priority: 'Low',
          status: 'Resolved'
        }
      ]);

      const response = await request(app)
        .get('/api/issues/myIssues')
        .set('Authorization', `Bearer ${citizenToken}`)
        .query({ status: 'Submitted' });

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].status).toBe('Submitted');
    });
  });

  describe('GET /api/issues/getIssue/:id', () => {
    it('should return issue details for owner', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        priorityScore: 0.7,
        priority: 'High'
      });

      const response = await request(app)
        .get(`/api/issues/getIssue/${issue._id}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      expect(response.body.issue).toHaveProperty('_id');
      expect(response.body.issue._id.toString()).toBe(issue._id.toString());
      expect(response.body.issue.description).toBe('Test issue');
      expect(response.body.issue.reporter).toHaveProperty('name', 'Test Citizen');
    });

    it('should return 403 for non-owner non-officer non-admin', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
      testOfficer = await User.create({
        name: 'Test Officer',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer'
      });

      // Create issue owned by one user
      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        priorityScore: 0.7,
        priority: 'High'
      });

      // Try to access with different user (officer)
      const response = await request(app)
        .get(`/api/issues/getIssue/${issue._id}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should return 404 for non-existent issue', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/issues/getIssue/${fakeId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Issue not found');
    });
  });

  describe('GET /api/issues/nearby', () => {
    it('should return nearby issues based on geospatial query', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      // Create issues at different locations
      await Issue.create([
        {
          category: 'road_damage',
          description: 'Nearby issue',
          location: { type: 'Point', coordinates: [75.8577, 22.7196] }, // Exact match
          reporter: testUser._id,
          priorityScore: 0.7,
          priority: 'High'
        },
        {
          category: 'garbage',
          description: 'Far away issue',
          location: { type: 'Point', coordinates: [76.0000, 23.0000] }, // Far away
          reporter: testUser._id,
          priorityScore: 0.4,
          priority: 'Medium'
        }
      ]);

      const response = await request(app)
        .get('/api/issues/nearby')
        .set('Authorization', `Bearer ${citizenToken}`)
        .query({ lat: '22.7196', lng: '75.8577', radius: '1000' }); // 1km radius

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].description).toBe('Nearby issue');
    });

    it('should filter by category', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      // Create issues of different categories at same location
      await Issue.create([
        {
          category: 'road_damage',
          description: 'Road damage issue',
          location: { type: 'Point', coordinates: [75.8577, 22.7196] },
          reporter: testUser._id,
          priorityScore: 0.7,
          priority: 'High'
        },
        {
          category: 'garbage',
          description: 'Garbage issue',
          location: { type: 'Point', coordinates: [75.8577, 22.7196] },
          reporter: testUser._id,
          priorityScore: 0.5,
          priority: 'Medium'
        }
      ]);

      const response = await request(app)
        .get('/api/issues/nearby')
        .set('Authorization', `Bearer ${citizenToken}`)
        .query({ lat: '22.7196', lng: '75.8577', category: 'garbage' });

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].category).toBe('garbage');
    });

    it('should reject missing lat/lng', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const response = await request(app)
        .get('/api/issues/nearby')
        .set('Authorization', `Bearer ${citizenToken}`)
        .query({ lat: '22.7196' }); // Missing lng

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('lat and lng are required');
    });
  });

  describe('PATCH /api/issues/progress/:id', () => {
    it('should allow officer to update issue progress', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
      testOfficer = await User.create({
        name: 'Test Officer',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer'
      });

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        assignedTo: testOfficer._id,
        priorityScore: 0.6,
        priority: 'Medium',
        status: 'Submitted'
      });

      const response = await request(app)
        .patch(`/api/issues/progress/${issue._id}`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ status: 'In Progress', remark: 'Started work' });

      expect(response.status).toBe(200);
      expect(response.body.issue.status).toBe('In Progress');
      expect(response.body.issue.statusHistory).toHaveLength(2);
    });

    it('should prevent non-assigned user from updating progress', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
      testOfficer = await User.create({
        name: 'Test Officer',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer'
      });
      const otherOfficer = await User.create({
        name: 'Other Officer',
        email: 'other@example.com',
        password: 'password123',
        role: 'officer'
      });
      const otherOfficerToken = jwt.sign(
        { userId: otherOfficer._id.toString(), role: otherOfficer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        assignedTo: testOfficer._id,
        priorityScore: 0.6,
        priority: 'Medium',
        status: 'Submitted'
      });

      const response = await request(app)
        .patch(`/api/issues/progress/${issue._id}`)
        .set('Authorization', `Bearer ${otherOfficerToken}`)
        .send({ status: 'In Progress', remark: 'Started work' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You are not assigned to this issue');
    });
  });

  describe('POST /api/issues/confirm/:id', () => {
    it('should allow reporter to confirm resolved issue', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        priorityScore: 0.8,
        priority: 'High',
        status: 'Resolved'
      });

      const response = await request(app)
        .post(`/api/issues/confirm/${issue._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ confirmed: true, rating: 5, feedback: 'Great job!' });

      expect(response.status).toBe(200);
      expect(response.body.issue.citizenConfirmed).toBe(true);
      expect(response.body.issue.rating).toBe(5);
      expect(response.body.issue.feedback).toBe('Great job!');
    });

    it('should prevent confirmation of non-resolved issue', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        priorityScore: 0.8,
        priority: 'High',
        status: 'Submitted' // Not resolved
      });

      const response = await request(app)
        .post(`/api/issues/confirm/${issue._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ confirmed: true, rating: 5 });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe('Issue must be Resolved before confirmation');
    });

    it('should prevent non-reporter from confirming', async () => {
      // Create test users if not already created
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
      testOfficer = await User.create({
        name: 'Test Officer',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer'
      });

      const issue = await Issue.create({
        category: 'road_damage',
        description: 'Test issue',
        location: { type: 'Point', coordinates: [75.8577, 22.7196] },
        reporter: testUser._id,
        priorityScore: 0.8,
        priority: 'High',
        status: 'Resolved'
      });

      // Try to confirm with officer
      const response = await request(app)
        .post(`/api/issues/confirm/${issue._id}`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ confirmed: true, rating: 5 });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Only the reporter can confirm resolution');
    });
  });
});