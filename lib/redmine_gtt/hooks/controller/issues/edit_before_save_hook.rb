module RedmineGtt
  module Hooks
    class ControllerIssuesEditBeforeSaveHook < Redmine::Hook::ViewListener
      def controller_issues_edit_before_save(context={})
        if ( context[:params] && context[:params][:issue] &&
            context[:params][:issue][:geom] &&
            User.current.allowed_to?(:edit_issues, context[:issue].project))
        	context[:issue].geom = context[:params][:issue][:geom]
        end
        return ''
      end
    end
  end
end
