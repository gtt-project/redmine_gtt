require_relative '../test_helper'

class UserTest < GttTest
  fixtures :users

  setup do
    @user = User.find_by_login 'dlopper'
    @user.update_column :geom, test_wkb
  end

  test 'should have geojson attribute' do
    assert_geojson @user.geojson
  end

  test 'should render properties in as_geojson' do
    j = @user.as_geojson include_properties: true
    assert_geojson j
    assert_equal @user.id, j['properties']['id']
    assert_equal @user.lastname, j['properties']['lastname']
    assert_equal @user.login, j['properties']['login']
    assert_nil j['properties']['geom']
    assert_nil j['properties']['auth_source_id']

    j = @user.as_geojson include_properties: { only: [:id, :lastname] }
    assert_geojson j
    assert_equal @user.id, j['properties']['id']
    assert_equal @user.lastname, j['properties']['lastname']
    assert_nil j['properties']['login']
    assert_nil j['properties']['geom']
    assert_nil j['properties']['auth_source_id']
  end

end





