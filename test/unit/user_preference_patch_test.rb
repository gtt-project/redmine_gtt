require_relative '../test_helper'

class UserPreferencePatchTest < GttTest
  fixtures :users

  setup do
    @pref = User.find_by_login('dlopper').pref
  end

  test 'preference is off by default' do
    assert_not @pref.gtt_watch_nearby?
    assert_nil @pref.gtt_watch_radius_km
  end

  test 'accessors persist through the serialized others hash' do
    @pref.gtt_watch_nearby = '1'
    @pref.gtt_watch_radius = '25'
    assert @pref.save

    pref = User.find_by_login('dlopper').pref
    assert pref.gtt_watch_nearby?
    assert_equal 25, pref.gtt_watch_radius_km
  end

  test 'safe_attributes mass-assignment works for the new keys' do
    @pref.safe_attributes = {
      'gtt_watch_nearby' => '1', 'gtt_watch_radius' => '10'
    }
    assert @pref.save

    pref = User.find_by_login('dlopper').pref
    assert pref.gtt_watch_nearby?
    assert_equal 10, pref.gtt_watch_radius_km
  end

  test 'gtt_watch_nearby? treats anything but "1" as off' do
    ['0', '', nil, 'true'].each do |value|
      @pref.gtt_watch_nearby = value
      assert_not @pref.gtt_watch_nearby?, "expected #{value.inspect} to be off"
    end
  end

  test 'gtt_watch_radius_km rejects blank, non-numeric and non-positive values' do
    [nil, '', 'abc', '0', '-5', '2.5'].each do |value|
      @pref.gtt_watch_radius = value
      assert_nil @pref.gtt_watch_radius_km, "expected #{value.inspect} to be nil"
    end
  end

  test 'gtt_watch_radius_km caps the radius server-side' do
    @pref.gtt_watch_radius = '999999'
    assert_equal RedmineGtt::Patches::UserPreferencePatch::NEARBY_WATCH_MAX_RADIUS_KM,
      @pref.gtt_watch_radius_km
  end
end
