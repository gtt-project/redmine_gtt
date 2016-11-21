module RedmineGtt
  module Patches

    module IssuesControllerPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          alias_method_chain :show, :geojson
          alias_method_chain :index, :geojson
        end
      end

      module ClassMethods
      end

      module InstanceMethods
        def show_with_geojson
          respond_to do |format|
            format.geojson { send_data(
              @issue.geojson.to_json,
              :type => 'application/json; header=present',
              :filename => "#{@issue.id}.geojson")
            }
            format.any { show_without_geojson }
          end
        end

        def index_with_geojson
          # It's not so great to have to copy the whole "index" method to add
          # another output format (geojson). Hopefully this isn't too annoying
          # to maintain. See the previous alias how it would be much nicer.
          retrieve_query
          sort_init(@query.sort_criteria.empty? ? [['id', 'desc']] : @query.sort_criteria)
          sort_update(@query.sortable_columns)
          @query.sort_criteria = sort_criteria.to_a

          if @query.valid?
            case params[:format]
            when 'csv', 'pdf'
              @limit = Setting.issues_export_limit.to_i
              if params[:columns] == 'all'
                @query.column_names = @query.available_inline_columns.map(&:name)
              end
            when 'atom'
              @limit = Setting.feeds_limit.to_i
            when 'xml', 'json'
              @offset, @limit = api_offset_and_limit
              @query.column_names = %w(author)
            else
              @limit = per_page_option
            end

            @issue_count = @query.issue_count
            @issue_pages = Redmine::Pagination::Paginator.new @issue_count, @limit, params['page']
            @offset ||= @issue_pages.offset
            @issues = @query.issues(:include => [:assigned_to, :tracker, :priority, :category, :fixed_version],
                                    :order => sort_clause,
                                    :offset => @offset,
                                    :limit => @limit)
            @issue_count_by_group = @query.issue_count_by_group

            respond_to do |format|
              format.geojson { send_data(
                IssuesHelper.get_geojson(@issues).to_json,
                :type => 'application/json; header=present',
                :filename => "issues.geojson")
              }
              format.any { index_without_geojson }
            end
          end
        end
      end

    end
  end
end

unless IssuesController.included_modules.include?(RedmineGtt::Patches::IssuesControllerPatch)
  IssuesController.send(:include, RedmineGtt::Patches::IssuesControllerPatch)
end
