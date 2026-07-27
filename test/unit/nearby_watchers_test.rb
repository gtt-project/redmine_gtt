require_relative '../test_helper'

class NearbyWatchersTest < GttTest
  fixtures :users, :email_addresses, :user_preferences,
           :roles, :projects, :members, :member_roles, :enabled_modules,
           :trackers, :projects_trackers, :issue_statuses, :enumerations

  TOKYO = [139.691706, 35.689524, 0.0].freeze
  NEAR_TOKYO = [139.7, 35.69, 0.0].freeze   # < 1 km from TOKYO
  OSAKA = [135.5023, 34.6937, 0.0].freeze   # ~ 400 km from TOKYO

  setup do
    @user = User.find_by_login 'dlopper' # member of the public project 1
    @user.update_attribute :geojson, point_geojson(TOKYO)
    @user.pref.update(gtt_watch_nearby: '1', gtt_watch_radius: '25')
  end

  test 'subscribes an opted-in user within their radius on issue creation' do
    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_includes issue.watcher_users, @user
  end

  test 'does not subscribe a user outside their radius' do
    @user.update_attribute :geojson, point_geojson(OSAKA)

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_not_includes issue.watcher_users, @user
  end

  test 'subscribes a distant user whose radius is large enough' do
    @user.update_attribute :geojson, point_geojson(OSAKA)
    @user.pref.update(gtt_watch_radius: '500')

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_includes issue.watcher_users, @user
  end

  test 'does not subscribe when the preference is off' do
    @user.pref.update(gtt_watch_nearby: '0')

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_not_includes issue.watcher_users, @user
  end

  test 'does not subscribe when no radius is set' do
    @user.pref.update(gtt_watch_radius: '')

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_not_includes issue.watcher_users, @user
  end

  test 'does not subscribe a user without a stored location' do
    @user.update_attribute :geom, nil

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_not_includes issue.watcher_users, @user
  end

  test 'does not subscribe a locked user' do
    @user.update_attribute :status, User::STATUS_LOCKED

    issue = create_issue_with_geom!(1, NEAR_TOKYO)

    assert_not_includes issue.watcher_users, @user
  end

  test 'never subscribes a user who cannot see the issue' do
    # project 2 (OnlineStore) is private; dlopper is not a member
    issue = create_issue_with_geom!(2, NEAR_TOKYO)

    assert_not issue.visible?(@user), 'fixture assumption: issue must not be visible'
    assert_not_includes issue.watcher_users, @user
  end

  test 'subscribes when the geometry is added to an existing issue' do
    issue = create_issue_with_geom!(1, nil)
    assert_not_includes issue.watcher_users, @user

    issue.update!(geojson: point_geojson(NEAR_TOKYO))

    assert_includes issue.reload.watcher_users, @user
  end

  test 'an issue without geometry subscribes nobody' do
    issue = create_issue_with_geom!(1, nil)

    assert_equal [], issue.watcher_users
  end

  private

  def create_issue_with_geom!(project_id, coordinates)
    project = Project.find(project_id)
    issue = Issue.new(
      project: project,
      tracker: project.trackers.first,
      author: User.find_by_login('jsmith'),
      subject: 'nearby watcher test',
      priority: IssuePriority.first,
      status_id: 1
    )
    issue.geojson = point_geojson(coordinates) if coordinates
    issue.save!
    issue
  end
end
