const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

let app;
let mongoServer;
let Issue;
let User;
let Notification;

jest.setTimeout(180000);

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0,
        dbName: 'civics-test'
      }
    });
    const uri = mongoServer.getUri();

    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'testjwtsecret';
    process.env.CLOUDINARY_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(uri, {
      maxPoolSize: 5,
      minPoolSize: 1
    });

    app = require('../server');
    Issue = require('../../shared/models/Issue');
    User = require('../../shared/models/User');
    Notification = require('../../shared/models/Notification');

    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err) {
    console.error('beforeAll error:', err);
    throw err;
  }
}, 180000);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.error('afterAll error:', err);
  }
}, 30000);

describe('Complete Issue Reporting Flow', () => {
  let citizenToken, officerToken, adminToken;
  let citizenUser, officerUser, adminUser;
  let createdIssue;

  beforeEach(async () => {
    await Issue.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});

    citizenUser = await User.create({
      name: 'Test Citizen',
      email: 'citizen@test.com',
      password: 'password123',
      role: 'citizen',
      pushToken: 'ExponentPushToken[test-citizen]'
    });

    officerUser = await User.create({
      name: 'Test Officer',
      email: 'officer@test.com',
      password: 'password123',
      role: 'officer',
      pushToken: 'ExponentPushToken[test-officer]'
    });

    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    citizenToken = jwt.sign(
      { userId: citizenUser._id.toString(), role: 'citizen' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    officerToken = jwt.sign(
      { userId: officerUser._id.toString(), role: 'officer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('should complete full flow: create issue, assign, update progress, confirm, and send notifications', async () => {
    // 1. Citizen creates issue
    const createResponse = await request(app)
      .post('/api/issues/create')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('category', 'road_damage')
      .field('description', 'Large pothole blocking traffic')
      .field('latitude', '22.7196')
      .field('longitude', '75.8577')
      .field('address', 'Main Street, City Center');

    expect(createResponse.status).toBe(201);
    createdIssue = createResponse.body.issue;
    expect(createdIssue).toHaveProperty('trackingId');
    expect(createdIssue.status).toBe('Submitted');
    expect(createdIssue.reporter.toString()).toBe(citizenUser._id.toString());

    // 2. Admin assigns issue to officer (simulated with direct update)
    await Issue.findByIdAndUpdate(
      createdIssue._id,
      {
        assignedTo: officerUser._id,
        status: 'Assigned'
      }
    );

    // 3. Officer gets assigned issues
    const assignedResponse = await request(app)
      .get('/api/issues/assigned')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(assignedResponse.status).toBe(200);
    expect(assignedResponse.body.issues).toHaveLength(1);
    expect(assignedResponse.body.issues[0].status).toBe('Assigned');

    // 4. Officer updates progress to In Progress
    const progressResponse = await request(app)
      .patch(`/api/issues/progress/${createdIssue._id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: 'In Progress',
        remark: 'Road crew dispatched to site'
      });

    expect(progressResponse.status).toBe(200);
    expect(progressResponse.body.issue.status).toBe('In Progress');

    // 5. Check citizen received notification
    const citNotificationsResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${citizenToken}`)
      .query({ unread: 'true' });

    expect(citNotificationsResponse.status).toBe(200);
    expect(citNotificationsResponse.body.unreadCount).toBeGreaterThan(0);

    // 6. Officer updates to Resolved
    const resolvedResponse = await request(app)
      .patch(`/api/issues/progress/${createdIssue._id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: 'Resolved',
        remark: 'Pothole filled and compacted'
      });

    expect(resolvedResponse.status).toBe(200);
    expect(resolvedResponse.body.issue.status).toBe('Resolved');

    // 7. Citizen confirms resolution
    const confirmResponse = await request(app)
      .post(`/api/issues/confirm/${createdIssue._id}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        confirmed: true,
        rating: 5,
        feedback: 'Excellent work, road is smooth now'
      });

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.issue.citizenConfirmed).toBe(true);
    expect(confirmResponse.body.issue.rating).toBe(5);
    expect(confirmResponse.body.issue.feedback).toBe('Excellent work, road is smooth now');

    // 8. Verify officer received notifications
    const offNotificationsResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(offNotificationsResponse.status).toBe(200);
  });

  it('should prevent officer from updating issue not assigned to them', async () => {
    const otherOfficer = await User.create({
      name: 'Other Officer',
      email: 'other@test.com',
      password: 'password123',
      role: 'officer'
    });
    const otherOfficerToken = jwt.sign(
      { userId: otherOfficer._id.toString(), role: 'officer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    createdIssue = await Issue.create({
      category: 'road_damage',
      description: 'Test issue',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      assignedTo: officerUser._id,
      priorityScore: 0.6,
      priority: 'Medium',
      status: 'Assigned'
    });

    const response = await request(app)
      .patch(`/api/issues/progress/${createdIssue._id}`)
      .set('Authorization', `Bearer ${otherOfficerToken}`)
      .send({ status: 'In Progress', remark: 'Test' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You are not assigned to this issue');
  });

  it('should sort assigned issues by priority score descending then created at ascending', async () => {
    const oldIssue = await Issue.create({
      category: 'road_damage',
      description: 'Old low priority',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      assignedTo: officerUser._id,
      priorityScore: 0.3,
      priority: 'Low',
      status: 'Assigned',
      createdAt: new Date(Date.now() - 86400000) // 1 day old
    });

    const newHighPriority = await Issue.create({
      category: 'water',
      description: 'New high priority',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      assignedTo: officerUser._id,
      priorityScore: 0.85,
      priority: 'High',
      status: 'Assigned'
    });

    const response = await request(app)
      .get('/api/issues/assigned')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.issues).toHaveLength(2);
    expect(response.body.issues[0]._id.toString()).toBe(newHighPriority._id.toString());
    expect(response.body.issues[1]._id.toString()).toBe(oldIssue._id.toString());
  });

  it('should allow citizen to reopen resolved issue', async () => {
    createdIssue = await Issue.create({
      category: 'road_damage',
      description: 'Test issue',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      assignedTo: officerUser._id,
      priorityScore: 0.6,
      priority: 'Medium',
      status: 'Resolved'
    });

    const response = await request(app)
      .post(`/api/issues/confirm/${createdIssue._id}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ confirmed: false });

    expect(response.status).toBe(200);
    expect(response.body.issue.status).toBe('In Progress');

    const notification = await Notification.findOne({
      recipient: officerUser._id,
      type: 'status_update',
      issue: createdIssue._id
    });
    expect(notification).toBeTruthy();
  });

  it('should mark notifications as read', async () => {
    const notification = await Notification.create({
      recipient: citizenUser._id,
      sender: officerUser._id,
      type: 'status_update',
      message: 'Issue updated',
      read: false
    });

    const response = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notification.read).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    await Notification.create([
      {
        recipient: citizenUser._id,
        type: 'status_update',
        message: 'Update 1',
        read: false
      },
      {
        recipient: citizenUser._id,
        type: 'status_update',
        message: 'Update 2',
        read: false
      }
    ]);

    const response = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);

    const unreadCount = await Notification.countDocuments({
      recipient: citizenUser._id,
      read: false
    });
    expect(unreadCount).toBe(0);
  });

  it('should return notifications with unread count', async () => {
    await Notification.create([
      {
        recipient: citizenUser._id,
        sender: officerUser._id,
        type: 'status_update',
        message: 'Issue update',
        read: false
      },
      {
        recipient: citizenUser._id,
        type: 'status_update',
        message: 'Old notification',
        read: true
      }
    ]);

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(2);
    expect(response.body.unreadCount).toBe(1);
  });

  it('should filter unread notifications only', async () => {
    await Notification.create([
      {
        recipient: citizenUser._id,
        type: 'status_update',
        message: 'Unread',
        read: false
      },
      {
        recipient: citizenUser._id,
        type: 'status_update',
        message: 'Read',
        read: true
      }
    ]);

    const response = await request(app)
      .get('/api/notifications?unread=true')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.notifications[0].read).toBe(false);
  });

  it('should prevent non-reporter from confirming issue', async () => {
    createdIssue = await Issue.create({
      category: 'road_damage',
      description: 'Test issue',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      priorityScore: 0.6,
      priority: 'Medium',
      status: 'Resolved'
    });

    const response = await request(app)
      .post(`/api/issues/confirm/${createdIssue._id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ confirmed: true });

    expect(response.status).toBe(403);
  });

  it('should prevent confirmation of non-resolved issue', async () => {
    createdIssue = await Issue.create({
      category: 'road_damage',
      description: 'Test issue',
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      reporter: citizenUser._id,
      priorityScore: 0.6,
      priority: 'Medium',
      status: 'In Progress'
    });

    const response = await request(app)
      .post(`/api/issues/confirm/${createdIssue._id}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ confirmed: true });

    expect(response.status).toBe(422);
  });
});