module RedmineGtt
  module Hooks
    class ViewUsersFormHook < Redmine::Hook::ViewListener
      def view_users_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => context[:user].geojson, :id => 'geom')

        section << tag(:div, :data => {
          :geom => context[:user].geojson,
          :edit => 'Point'
        }, :id => 'ol-' + rand(36**8).to_s(36), :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
