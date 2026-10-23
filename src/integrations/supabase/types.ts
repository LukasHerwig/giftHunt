
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_invitations": {
                  Row: {
                    "accepted": boolean,"created_at": string,"email": string,"expires_at": string | null,"id": string,"invitation_token": string,"invited_by": string,"wishlist_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted"?: boolean,"created_at"?: string,"email": string,"expires_at"?: string | null,"id"?: string,"invitation_token": string,"invited_by": string,"wishlist_id": string
                  }
                  Update: {
                    "accepted"?: boolean,"created_at"?: string,"email"?: string,"expires_at"?: string | null,"id"?: string,"invitation_token"?: string,"invited_by"?: string,"wishlist_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_invitations_wishlist_id_fkey"
      columns: ["wishlist_id"]
isOneToOne: true
      referencedRelation: "wishlists"
      referencedColumns: ["id"]
    }
                  ]
                },"item_change_requests": {
  Row: {
    "created_at": string,"created_by": string,"id": string,"item_id": string | null,"item_title": string,"kind": string,"message": string | null,"proposed": Json | null,"resolved_at": string | null,"resolved_by": string | null,"status": string,"wishlist_id": string
  }
  ComputedFields: never
  Insert: {
    "created_at"?: string,"created_by": string,"id"?: string,"item_id"?: string | null,"item_title": string,"kind": string,"message"?: string | null,"proposed"?: Json | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"wishlist_id": string
  }
  Update: {
    "created_at"?: string,"created_by"?: string,"id"?: string,"item_id"?: string | null,"item_title"?: string,"kind"?: string,"message"?: string | null,"proposed"?: Json | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"wishlist_id"?: string
  }
  Relationships: []
},"item_claims": {
                  Row: {
                    "claimed_at": string,"claimer_name": string,"created_at": string,"id": string,"item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "claimed_at"?: string,"claimer_name": string,"created_at"?: string,"id"?: string,"item_id": string
                  }
                  Update: {
                    "claimed_at"?: string,"claimer_name"?: string,"created_at"?: string,"id"?: string,"item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_claims_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "wishlist_items"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"share_links": {
                  Row: {
                    "created_at": string,"created_by": string,"expires_at": string | null,"id": string,"is_active": boolean,"token": string,"wishlist_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"token": string,"wishlist_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"token"?: string,"wishlist_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "share_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "share_links_wishlist_id_fkey"
      columns: ["wishlist_id"]
isOneToOne: false
      referencedRelation: "wishlists"
      referencedColumns: ["id"]
    }
                  ]
                },"wishlist_admins": {
                  Row: {
                    "admin_id": string,"created_at": string,"id": string,"invited_by": string,"wishlist_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_id": string,"created_at"?: string,"id"?: string,"invited_by": string,"wishlist_id": string
                  }
                  Update: {
                    "admin_id"?: string,"created_at"?: string,"id"?: string,"invited_by"?: string,"wishlist_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wishlist_admins_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_admins_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_admins_wishlist_id_fkey"
      columns: ["wishlist_id"]
isOneToOne: true
      referencedRelation: "wishlists"
      referencedColumns: ["id"]
    }
                  ]
                },"wishlist_items": {
                  Row: {
                    "claim_cap": number | null,"claimed_at": string | null,"claimed_by": string | null,"created_at": string,"description": string | null,"id": string,"is_giftcard": boolean | null,"is_taken": boolean,"link": string | null,"price_range": string | null,"priority": number | null,"taken_at": string | null,"taken_by_name": string | null,"title": string,"updated_at": string,"url": string | null,"wishlist_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "claim_cap"?: number | null,"claimed_at"?: string | null,"claimed_by"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_giftcard"?: boolean | null,"is_taken"?: boolean,"link"?: string | null,"price_range"?: string | null,"priority"?: number | null,"taken_at"?: string | null,"taken_by_name"?: string | null,"title": string,"updated_at"?: string,"url"?: string | null,"wishlist_id": string
                  }
                  Update: {
                    "claim_cap"?: number | null,"claimed_at"?: string | null,"claimed_by"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_giftcard"?: boolean | null,"is_taken"?: boolean,"link"?: string | null,"price_range"?: string | null,"priority"?: number | null,"taken_at"?: string | null,"taken_by_name"?: string | null,"title"?: string,"updated_at"?: string,"url"?: string | null,"wishlist_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wishlist_items_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_items_wishlist_id_fkey"
      columns: ["wishlist_id"]
isOneToOne: false
      referencedRelation: "wishlists"
      referencedColumns: ["id"]
    }
                  ]
                },"wishlists": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"creator_id": string,"description": string | null,"enable_links": boolean | null,"enable_price": boolean | null,"enable_priority": boolean | null,"id": string,"is_self_managed": boolean,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"creator_id": string,"description"?: string | null,"enable_links"?: boolean | null,"enable_price"?: boolean | null,"enable_priority"?: boolean | null,"id"?: string,"is_self_managed"?: boolean,"title": string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"creator_id"?: string,"description"?: string | null,"enable_links"?: boolean | null,"enable_price"?: boolean | null,"enable_priority"?: boolean | null,"id"?: string,"is_self_managed"?: boolean,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wishlists_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "wishlist_items_admin": {
              Row: {
                "claim_cap": number | null,"created_at": string,"description": string | null,"id": string,"is_giftcard": boolean | null,"is_taken": boolean,"link": string | null,"price_range": string | null,"priority": number | null,"taken_at": string | null,"taken_by_name": string | null,"title": string,"updated_at": string,"url": string | null,"wishlist_id": string
              }
              Relationships: []
            }
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"archive_wishlist":
{ Args: { "p_wishlist_id": string }; Returns: undefined
                           },
"can_see_profile":
{ Args: { "p_profile_id": string }; Returns: boolean
                           },
"claim_shared_item":
{ Args: { "p_item_id": string,"p_name": string,"p_token": string }; Returns: undefined
                           },
"get_invitation_by_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"get_shared_wishlist":
{ Args: { "p_token": string }; Returns: Json
                           },
"has_pending_invitation":
{ Args: { "p_wishlist_id": string }; Returns: boolean
                           },
"is_wishlist_admin":
{ Args: { "p_wishlist_id": string }; Returns: boolean
                           },
"is_wishlist_owner":
{ Args: { "p_wishlist_id": string }; Returns: boolean
                           },
"item_wishlist_id":
{ Args: { "p_item_id": string }; Returns: string
                           },
"request_item_change":
{ Args: { "p_item_id": string,"p_kind": string,"p_proposed"?: Json }; Returns: string
                           },
"withdraw_change_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"resolve_change_request":
{ Args: { "p_request_id": string,"p_approve": boolean,"p_message"?: string }; Returns: undefined
                           },
"decline_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"remove_wishlist_admin":
{ Args: { "p_wishlist_id": string }; Returns: Json
                           },
"unarchive_wishlist":
{ Args: { "p_wishlist_id": string }; Returns: undefined
                           },
"wishlist_has_share_link":
{ Args: { "p_wishlist_id": string }; Returns: boolean
                           },
"wishlist_is_archived":
{ Args: { "p_wishlist_id": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
